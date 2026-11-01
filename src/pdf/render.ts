import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { PdfModel } from "@/bff/pdf/document";
import CvDocument, { type PdfAssets } from "./CvDocument";

/** PDF view model + images rendered by the page → PDF bytes. */
export const renderCvPdf = (model: PdfModel, assets: PdfAssets): Promise<Buffer> =>
  renderToBuffer(createElement(CvDocument, { model, assets }) as Parameters<typeof renderToBuffer>[0]);
