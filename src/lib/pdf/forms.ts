import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  type PDFForm,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
} from "pdf-lib";

import { fileToBytes } from "./file";

export type FormFieldType =
  | "text"
  | "checkbox"
  | "dropdown"
  | "optionlist"
  | "radio"
  | "unknown";

export interface FormField {
  name: string;
  type: FormFieldType;
  value: string | boolean;
  options?: string[];
}

export type FormValues = Record<string, string | boolean>;

/** Read fillable form fields with their current values. */
export async function readFormFields(file: File): Promise<FormField[]> {
  const doc = await PDFDocument.load(await fileToBytes(file), {
    ignoreEncryption: true,
  });
  const form = doc.getForm();
  return form.getFields().map((f) => {
    const name = f.getName();
    if (f instanceof PDFTextField) {
      return { name, type: "text", value: f.getText() ?? "" };
    }
    if (f instanceof PDFCheckBox) {
      return { name, type: "checkbox", value: f.isChecked() };
    }
    if (f instanceof PDFDropdown) {
      return {
        name,
        type: "dropdown",
        value: f.getSelected()[0] ?? "",
        options: f.getOptions(),
      };
    }
    if (f instanceof PDFOptionList) {
      return {
        name,
        type: "optionlist",
        value: f.getSelected()[0] ?? "",
        options: f.getOptions(),
      };
    }
    if (f instanceof PDFRadioGroup) {
      return {
        name,
        type: "radio",
        value: f.getSelected() ?? "",
        options: f.getOptions(),
      };
    }
    return { name, type: "unknown", value: "" };
  });
}

/** Apply user-entered values back onto a PDF form (mutates the form's doc). */
export function applyFormValues(form: PDFForm, values: FormValues) {
  for (const f of form.getFields()) {
    const name = f.getName();
    if (!(name in values)) continue;
    const v = values[name];
    try {
      if (f instanceof PDFTextField) {
        f.setText(v == null ? "" : String(v));
      } else if (f instanceof PDFCheckBox) {
        if (v) f.check();
        else f.uncheck();
      } else if (
        f instanceof PDFDropdown ||
        f instanceof PDFOptionList ||
        f instanceof PDFRadioGroup
      ) {
        if (v) f.select(String(v));
      }
    } catch {
      // skip a field that can't accept the value
    }
  }
}
