import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploadedProduct, setUploadedProduct] = useState(null);
  const [issue, setIssue] = useState("The product stopped working unexpectedly and previous support contact did not resolve the issue.");
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  };

  const startCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera is not supported on this browser. Please use file upload.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
    } catch (_e) {
      setCameraError("Camera permission denied or device camera is unavailable.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    const width = videoRef.current.videoWidth || 1280;
    const height = videoRef.current.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const captured = new File([blob], `invoice-capture-${Date.now()}.png`, { type: "image/png" });
      setFile(captured);
      setSuccess("Photo captured successfully.");
      stopCamera();
    }, "image/png", 0.95);
  };

  const downloadComplaintPdf = async () => {
    if (!complaint) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(13);
    doc.text(`Subject: ${complaint.emailSubject}`, 10, 15);
    const bodyLines = doc.splitTextToSize(complaint.emailBody, 180);
    doc.text(bodyLines, 10, 28);
    doc.addPage();
    doc.text("Tweet", 10, 15);
    const tweetLines = doc.splitTextToSize(complaint.tweet, 180);
    doc.text(tweetLines, 10, 24);
    doc.save(`complaint-${Date.now()}.pdf`);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await api.post("/products/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUploadedProduct(data);
      setSuccess("Invoice uploaded and extracted successfully.");

      setGenerating(true);
      const complaintRes = await api.post(`/ai/products/${data._id}/complaint`, {
        issueDescription: issue
      });
      setComplaint(complaintRes.data);
      setSuccess("Complaint generated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-7xl px-4 pb-10">
      <h1 className="text-4xl font-bold tracking-tight">Upload Invoice and Generate Complaint</h1>
      <p className="mt-2 text-sm text-slate-600">Use file upload or camera capture. OCR fields are auto-extracted and complaint draft is generated instantly.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="text-xl font-bold">Upload + Camera</h2>
          <p className="mt-1 text-sm text-slate-600">Supported: JPG, PNG, WEBP, PDF (max 10MB)</p>

          <form onSubmit={submit} className="mt-4 space-y-4">
            <label className="block rounded-xl border p-3 text-sm">
              Choose invoice file
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-2 w-full"
              />
            </label>

            <div className="rounded-xl border p-3">
              <p className="text-sm font-semibold">Capture using camera</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="rounded-lg bg-gradient-to-r from-teal to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Start Camera
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!cameraOn}
                  className="rounded-lg bg-gradient-to-r from-coral to-orange-500 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
                >
                  Capture Photo
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  disabled={!cameraOn}
                  className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  Stop Camera
                </button>
              </div>

              <div className="mt-3 overflow-hidden rounded-lg border bg-black/90">
                <video ref={videoRef} autoPlay playsInline muted className="h-56 w-full object-cover" />
              </div>

              {cameraError && <p className="mt-2 rounded bg-red-100 p-2 text-sm text-red-700">{cameraError}</p>}
            </div>

            <label className="block text-sm font-semibold">Issue summary for complaint generation</label>
            <textarea
              rows="4"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              className="w-full rounded-xl border p-3 text-sm"
            />

            {file && <p className="text-sm text-slate-600">Selected: {file.name}</p>}
            {error && <p className="rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}
            {success && <p className="rounded bg-emerald-100 p-2 text-sm text-emerald-700">{success}</p>}

            <button
              disabled={loading || generating || !file}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-coral to-orange-500 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {(loading || generating) && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {loading ? "Uploading and reading invoice..." : generating ? "Generating complaint..." : "Upload and Generate"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="text-xl font-bold">Complaint Output</h2>
          {!complaint && (
            <div className="mt-4 rounded-xl border border-dashed p-4 text-sm text-slate-500">
              Upload or capture an invoice to generate a polished complaint email.
            </div>
          )}

          {uploadedProduct && (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
              <p><strong>Product:</strong> {uploadedProduct.productName}</p>
              <p><strong>Purchase Date:</strong> {new Date(uploadedProduct.purchaseDate).toLocaleDateString()}</p>
              <p><strong>Warranty:</strong> {uploadedProduct.warrantyMonths} months</p>
            </div>
          )}

          {complaint && (
            <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
              <p><strong>Subject:</strong> {complaint.emailSubject}</p>
              <p className="whitespace-pre-wrap"><strong>Email:</strong> {complaint.emailBody}</p>
              <p className="whitespace-pre-wrap"><strong>Tweet:</strong> {complaint.tweet}</p>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(`${complaint.emailSubject}\n\n${complaint.emailBody}`)}
                  className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white"
                >
                  Copy Email
                </button>
                <button
                  type="button"
                  onClick={downloadComplaintPdf}
                  className="rounded-lg bg-teal px-4 py-2 text-xs font-semibold text-white"
                >
                  Download PDF
                </button>
                {uploadedProduct?._id && (
                  <button
                    type="button"
                    onClick={() => navigate(`/products/${uploadedProduct._id}`)}
                    className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-semibold"
                  >
                    Open Product Detail
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UploadPage;
