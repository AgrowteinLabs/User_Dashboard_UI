import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { motion } from "framer-motion";
import { FiSend } from "react-icons/fi";
import groboLogo from "../../assets/images/grobo-logo.png";
import "./AiAssistant.scss";

const ChatBot = ({ uid }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const thinkingMsg = { sender: "grobo", text: "👀 Grobo is thinking…" };
      setMessages((prev) => [...prev, thinkingMsg]);

      const response = await axios.post(
        "https://apiv2.agrowtein.com/api/v1/bot/UserB",
        {
          uid,
          question: input,
        }
      );

      const botReply = {
        sender: "grobo",
        text: response.data.answer || "I'm still thinking about that...",
      };

      setMessages((prev) =>
        [...prev.filter((msg) => msg.text !== thinkingMsg.text), botReply]
      );
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "grobo", text: "Sorry, I couldn't process that right now." },
      ]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="chatbot-section">
      <h3>💬 Ask Grobo</h3>
      <div className="chat-window">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            className={`chat-message ${msg.sender}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {msg.sender === "grobo" && (
  <img src={groboLogo} className="avatar grobo-avatar" alt="grobo" />
)}
            {msg.sender === "user" && <span className="avatar user">👤</span>}
            <p className="text">{msg.text}</p>
          </motion.div>
        ))}

        {loading && (
  <motion.div
    className="chat-message grobo typing"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </motion.div>
)}

        <div ref={endRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Ask something about your farm."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={sendMessage}>
          <FiSend />
        </button>
      </div>
    </div>
  );
};

ChatBot.propTypes = {
  uid: PropTypes.string.isRequired,
};

export default ChatBot;
