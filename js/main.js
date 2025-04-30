const upload = document.getElementById("pdf-upload");
const compressBtn = document.getElementById("compress-btn");
const alertBox = document.getElementById("custom-alert");
const fileNameDisplay = document.getElementById("fileName");

upload.addEventListener("change", () => {
  fileNameDisplay.textContent = upload.files[0]?.name || "";
});

compressBtn.addEventListener("click", async () => {
  const file = upload.files[0];
  if (!file || file.type !== "application/pdf") {
    showAlert("请选择一个 PDF 文件");
    return;
  }
  showAlert("开始压缩…",114514);

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 1.0 });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;

    const imgData = canvas.toDataURL("image/jpeg", 0.8);

    const jpgImage = await pdfDoc.embedJpg(imgData);
    const imgDims = jpgImage.scale(1);

    const pxToPt = px => px * 72 / 96;
    const pageDims = { width: pxToPt(canvas.width), height: pxToPt(canvas.height) };
    const newPage = pdfDoc.addPage([pageDims.width, pageDims.height]);
    newPage.drawImage(jpgImage, { x: 0, y: 0, width: pageDims.width, height: pageDims.height });
  }

  const compressedBytes = await pdfDoc.save();
  const blob = new Blob([compressedBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name.replace(/\.pdf$/i, "_compressed.pdf");
  a.click();

  showAlert("压缩完成，文件已下载");
});

let alertTimeout;

function showAlert(message,tim) {
  const alertEl = document.getElementById('custom-alert');
  alertEl.textContent = message;
  alertEl.classList.remove('hide');
  alertEl.classList.add('show');

  if (alertTimeout) clearTimeout(alertTimeout);
  if (tim==null||tim==undefined) tim = 2000;
  alertTimeout = setTimeout(() => {
    alertEl.classList.remove('show');
    alertEl.classList.add('hide');
    alertTimeout = null;
  }, tim);
}