import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { motion } from "framer-motion";
import { FiSend } from "react-icons/fi";
import { MdSmartToy, MdPerson, MdLightbulbOutline } from "react-icons/md";
import groboLogo from "../../assets/images/grobo-logo.png";
import "./AiAssistant.scss";

const SUGGESTIONS = [
  "How are my crop temperature ranges doing?",
  "What is the optimal pH level for my setup?",
  "Are there any sensor abnormalities detected?",
  "Recommendations to boost growth efficiency?",
];

const ChatBot = ({ uid }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "grobo",
      text: "👋 Hi! I'm Grobo, your AI farm advisor. Ask me anything about your sensor trends, climate conditions, or crop health recommendations!",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (textToSend) => {
    const query = typeof textToSend === "string" ? textToSend : input;
    if (!query.trim()) return;

    const userMessage = { sender: "user", text: query };
    setMessages((prev) => [...prev, userMessage]);
    if (typeof textToSend !== "string") setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/bot/UserB`,
        {
          uid,
          question: query,
        },
        { withCredentials: true }
      );

      const botReply = {
        sender: "grobo",
        text: response.data?.answer || "I have analyzed the data, but no additional recommendations were returned.",
      };

      setMessages((prev) => [...prev, botReply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "grobo",
          text: "I encountered a hiccup while analyzing that question. Please try again or rephrase your query.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="grobo-chatbot-section">
      <div className="chatbot-header">
        <div className="chatbot-title-box">
          <div className="bot-status-icon">
            <MdSmartToy />
            <span className="online-indicator" />
          </div>
          <div>
            <h3>Ask Grobo</h3>
            <p>Live AI Chat powered by your farm telemetry</p>
          </div>
        </div>
      </div>

      {/* Suggested prompts */}
      <div className="quick-suggestions-bar">
        <span className="suggestion-label">
          <MdLightbulbOutline /> Suggestions:
        </span>
        <div className="suggestion-chips">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              className="suggestion-chip"
              onClick={() => sendMessage(s)}
              disabled={loading}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div className="chat-window">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            className={`chat-message ${msg.sender}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {msg.sender === "grobo" ? (
              <div className="avatar-wrap grobo-avatar-wrap">
                <img src={groboLogo} className="avatar grobo-img" alt="Grobo" />
              </div>
            ) : (
              <div className="avatar-wrap user-avatar-wrap">
                <MdPerson />
              </div>
            )}
            <div className="message-bubble">
              <p className="text">{msg.text}</p>
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div
            className="chat-message grobo typing-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="avatar-wrap grobo-avatar-wrap">
              <img src={groboLogo} className="avatar grobo-img" alt="Grobo" />
            </div>
            <div className="message-bubble typing-bubble">
              <div className="typing-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      {/* Chat Input */}
      <div className="chat-input-bar">
        <input
          type="text"
          placeholder="Ask a question about your farm data (e.g. 'How is my temperature?')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={loading}
        />
        <button
          className="send-btn"
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          title="Send message"
        >
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
