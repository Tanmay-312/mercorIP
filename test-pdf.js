import fs from "fs";

async function testPdf() {
  try {
    const formData = new FormData();
    // we don't need a real pdf, just a buffer
    const blob = new Blob([new Uint8Array(10)], { type: "application/pdf" });
    formData.append("file", blob, "test.pdf");
    const res = await fetch("http://localhost:3000/api/parse-pdf", {
      method: "POST",
      body: formData,
    });
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("response:", text);
  } catch (e) {
    console.error(e);
  }
}
testPdf();
