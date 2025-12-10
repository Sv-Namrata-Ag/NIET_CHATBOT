import React, { useState, useEffect, useRef } from "react";
import "./nietchat.css";

export default function NIETChatbot() {
  const styles = {
    "--raspberry": "#e2111fff",
    "--raspberry-dark": "#551023",
    "--accent": "#F6F0F2",
  };

  const [open, setOpen] = useState(false); 
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: "Hello! I'm the NIET Assistant — how can I help you today?", time: now() },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [typing, setTyping] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    let sid = localStorage.getItem("niet_chat_session");
    if (!sid) {
      sid = `s_${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem("niet_chat_session", sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, open, typing]);

  const advanceStatus = (msgId) => {
    setTimeout(() => updateStatus(msgId, "sent"), 400);
    setTimeout(() => updateStatus(msgId, "delivered"), 900);
    setTimeout(() => updateStatus(msgId, "read"), 1600);
  };

  const updateStatus = (msgId, status) => {
    setMessages((m) => m.map((msg) => (msg.id === msgId ? { ...msg, status } : msg)));
  };

  const sendMessage = async (newText) => {
    if (!newText || newText.trim() === "") return;
    const id = Date.now();
    const userMsg = { id, from: "user", text: newText, time: now(), status: "sending" };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsSending(true);
    advanceStatus(id);

    try {
      setTimeout(() => setTyping(true), 200);

      const res = await fetch("/chatBot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newText, sessionId }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const botTexts = [];
      if (data.reply) botTexts.push(data.reply);
      if (Array.isArray(data.replies)) botTexts.push(...data.replies);
      if (data.text) botTexts.push(data.text);
      if (botTexts.length === 0) botTexts.push("Sorry, I couldn't generate a reply right now.");
      await delay(700);
      setTyping(false);

      setMessages((m) => [
        ...m,
        ...botTexts.map((t) => ({ id: Date.now() + Math.random(), from: "bot", text: t, time: now() })),
      ]);
    } catch (err) {
      console.error(err);
      setTyping(false);
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, from: "bot", text: "There was an error contacting the chat server. Please try again later.", time: now() },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e) => {
    e && e.preventDefault();
    sendMessage(input);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const toggleOpen = () => setOpen((v) => !v);

  return (
    <>
      {/*Floating launcher*/}
      <button
        className={`chat-launcher ${open ? "open" : ""}`}
        aria-label="Open chat"
        onClick={toggleOpen}
        title={open ? "Close chat" : "Open chat"}
      >
        <img src="/niet-logo.svg" alt="NIET" onError={(e) => (e.target.src = "/niet-logo.svg")} />
      </button>

      {/*Chat window*/}
      <div className={`niet-chat-wrapper ${open ? "visible" : "collapsed"}`} style={styles}>
        <div className="chat-card">
          <div className="chat-header">
            <div className="left">
              <img className="header-logo" src="/niet-logo.svg" alt="NIET logo" onError={(e) => (e.target.src = "/niet-logo.svg")} />
              <div>
                <div className="title">NIET Virtual Assistant</div>
                <div className="subtitle">Official - NIET</div>
              </div>
            </div>
          </div>

          <div className="chat-body">
            <div className="chat-area" ref={messagesRef} aria-label="chat-area">
              {messages.map((m) => (
                <div key={m.id} className={`message-row ${m.from === "user" ? "row-user" : "row-bot"}`}>
                  <div className="avatar">
                    {m.from === "bot" ? <img src="/niet-logo.svg" alt="NIET" onError={(e) => (e.target.src = "/niet-logo.svg")} /> : <span>user</span>}
                  </div>

                  <div className={`bubble-wrap ${m.from === "user" ? "user" : "bot"}`}>
                    <div className="bubble-text">{m.text}</div>
                    <div className="msg-meta">
                      <span className="time">{m.time}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/*Typing indicator*/}
              {typing && (
                <div className="message-row row-bot typing-row">
                  <div className="avatar"><img src="/niet-logo.svg" alt="NIET" onError={(e) => (e.target.src = "/niet-logo.svg")} /></div>
                  <div className="bubble-wrap bot typing-bubble">
                    <div className="typing-dots"><span /><span /><span /></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="chat-footer">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about admissions, departments, contacts..."
              aria-label="Message input"
            />
            <button type="submit" disabled={isSending} className="send-btn">Send</button>
          </form>
        </div>
      </div>
    </>
  );
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
