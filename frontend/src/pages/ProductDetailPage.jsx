import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [complaint, setComplaint] = useState(null);
  const [issue, setIssue] = useState("The product stopped working and support has not resolved the issue.");
  const [chatInput, setChatInput] = useState("Please help me draft a clear complaint for this product.");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [lostCard, setLostCard] = useState(null);

  const load = async () => {
    const { data } = await api.get(`/products/${id}`);
    setProduct(data);
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!product || complaint) return;
    generateComplaint();
    // Auto-generate initial complaint draft for quicker user workflow.
  }, [product]);

  const generateComplaint = async () => {
    const { data } = await api.post(`/ai/products/${id}/complaint`, { issueDescription: issue });
    setComplaint(data);
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const nextHistory = [...chatHistory, { role: "user", content: chatInput }];
    setChatHistory(nextHistory);
    setChatLoading(true);
    try {
      const { data } = await api.post(`/ai/products/${id}/complaint-chat`, {
        message: chatInput,
        history: nextHistory
      });
      setChatHistory((prev) => [...prev, { role: "assistant", content: data.assistantReply }]);
      setComplaint(data.complaintFormat);
      setChatInput("");
    } finally {
      setChatLoading(false);
    }
  };

  const updateLostMode = async (isLost) => {
    await api.patch(`/products/${id}/lost-mode`, {
      isLost,
      lastKnownLocation: "City Center",
      rewardAmount: 1000
    });
    await load();
  };

  const getLostCard = async () => {
    const { data } = await api.get(`/ai/products/${id}/lost-card`);
    setLostCard(data);
  };

  if (!product) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold">{product.productName}</h1>
        <p className="mt-2 text-sm text-slate-600">Warranty: {product.warrantyStatus}</p>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <p>Vendor: <strong>{product.vendor || "N/A"}</strong></p>
          <p>Category: <strong>{product.category || "N/A"}</strong></p>
          <p>Purchase Date: <strong>{new Date(product.purchaseDate).toLocaleDateString()}</strong></p>
          <p>Expiry Date: <strong>{new Date(product.warrantyExpiryDate).toLocaleDateString()}</strong></p>
          <p>Price: <strong>₹ {Number(product.price || 0).toLocaleString()}</strong></p>
          <p><a href={product.fileUrl} target="_blank" className="text-teal underline" rel="noreferrer">Open Uploaded File</a></p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6">
        <h2 className="text-xl font-bold">AI Complaint Assistant</h2>
        <textarea className="mt-3 w-full rounded-lg border p-3" rows="3" value={issue} onChange={(e) => setIssue(e.target.value)} />
        <button onClick={generateComplaint} className="mt-3 rounded-lg bg-coral px-4 py-2 font-semibold text-white">Generate Complaint</button>

        <div className="mt-5 rounded-lg border p-4">
          <p className="mb-2 text-sm font-semibold">Chat with AI to refine your complaint</p>
          <div className="max-h-56 space-y-2 overflow-auto rounded bg-slate-50 p-3 text-sm">
            {chatHistory.length === 0 && <p className="text-slate-500">No chat yet. Ask AI to rewrite tone, add legal context, or shorten the email.</p>}
            {chatHistory.map((msg, idx) => (
              <p key={idx}><strong>{msg.role === "assistant" ? "AI" : "You"}:</strong> {msg.content}</p>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask AI to improve your complaint format..."
              className="w-full rounded-lg border p-2"
            />
            <button onClick={sendChat} disabled={chatLoading} className="rounded-lg bg-ink px-4 py-2 text-white disabled:opacity-50">
              {chatLoading ? "Thinking..." : "Send"}
            </button>
          </div>
        </div>

        {complaint && (
          <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
            <p><strong>Subject:</strong> {complaint.emailSubject}</p>
            <p><strong>Email:</strong> {complaint.emailBody}</p>
            <p><strong>Tweet:</strong> {complaint.tweet}</p>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6">
        <h2 className="text-xl font-bold">Lost Item</h2>
        <div className="mt-3 flex gap-2">
          <button onClick={() => updateLostMode(true)} className="rounded-lg bg-ink px-4 py-2 text-white">Enable Lost Item</button>
          <button onClick={() => updateLostMode(false)} className="rounded-lg bg-slate-200 px-4 py-2">Disable</button>
          <button onClick={getLostCard} className="rounded-lg bg-teal px-4 py-2 text-white">Generate Lost Card</button>
        </div>
        {lostCard && (
          <div className="mt-4 rounded-lg border p-4 text-sm">
            <p><strong>Product:</strong> {lostCard.productName}</p>
            <p><strong>Location:</strong> {lostCard.lastKnownLocation}</p>
            <p><strong>Reward:</strong> ₹ {lostCard.rewardAmount}</p>
            <p><strong>Contact:</strong> {lostCard.contact.maskedEmail} | {lostCard.contact.maskedPhone}</p>
            <p className="mt-2 text-slate-600">{lostCard.shareText}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
