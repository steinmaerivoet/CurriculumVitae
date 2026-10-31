import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { PdfModel } from "@/bff/pdf/document";
import CvDocument from "./CvDocument";

/** PDF view model → PDF bytes. */
export const renderCvPdf = (model: PdfModel): Promise<Buffer> =>
  renderToBuffer(createElement(CvDocument, { model }) as Parameters<typeof renderToBuffer>[0]);
