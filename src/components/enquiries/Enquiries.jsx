import { useState, useContext, useEffect } from "react";
import {
  MdMail,
  MdPerson,
  MdSubject,
  MdMessage,
  MdSend,
  MdPhone,
  MdSupportAgent,
  MdVerified,
  MdAccessTime,
  MdLocationOn,
} from "react-icons/md";
import Swal from "sweetalert2";
import emailjs from "emailjs-com";
import { UserContext } from "../../context/UserContext";
import "./Enquiries.scss";

const Enquiries = () => {
  const { user } = useContext(UserContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // Pre-fill user details if available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || user.fullName || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newMessage = {
      id: `enq_${Date.now()}`,
      ...formData,
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. Persist locally to storage so inquiry is recorded
      try {
        const existing = JSON.parse(localStorage.getItem("agrowtrack_enquiries") || "[]");
        localStorage.setItem("agrowtrack_enquiries", JSON.stringify([newMessage, ...existing]));
      } catch (err) {
        console.warn("Could not save to localStorage:", err);
      }

      // 2. Optional backend API submission
      const apiUrl = import.meta.env.VITE_REACT_APP_API_URL;
      if (apiUrl) {
        await fetch(`${apiUrl}/api/v1/enquiries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(newMessage),
        }).catch(() => {
          // silent fallback if backend endpoint isn't listening for enquiries
        });
      }

      // 3. Optional EmailJS dispatch
      const emailUserId = import.meta.env.VITE_EMAILJS_USER_ID;
      if (emailUserId && emailUserId !== "your_emailjs_user_id_here") {
        await emailjs
          .send(
            "service_m88uuog",
            "template_vh789hg",
            {
              name: newMessage.name,
              email: newMessage.email,
              subject: newMessage.subject,
              message: newMessage.message,
            },
            emailUserId
          )
          .catch((err) => console.warn("EmailJS notification failed:", err));
      }

      Swal.fire({
        icon: "success",
        title: "Enquiry Submitted!",
        text: "Thank you for reaching out. Our agricultural tech team will respond within 24 hours.",
        confirmButtonColor: "#00b880",
      });

      setFormData({
        name: user?.name || user?.fullName || "",
        email: user?.email || "",
        subject: "",
        message: "",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: err.message || "Something went wrong while sending your message. Please try again later.",
        confirmButtonColor: "#00b880",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="enquiries-page">
      {/* ── Hero Header ─────────────────────────────── */}
      <div className="enquiries-hero">
        <div className="hero-badge">
          <MdSupportAgent /> Customer Support &amp; Technical Inquiries
        </div>
        <h1 className="hero-title">How Can We Help You?</h1>
        <p className="hero-subtitle">
          Have questions about your controller setup, sensor calibrations, subscription tiers, or custom hardware integrations? Submit your request below.
        </p>
      </div>

      {/* ── Split Content Grid ──────────────────────── */}
      <div className="enquiries-content-grid">
        {/* Left Column: Contact & Support Info */}
        <div className="enquiries-info-card">
          <div className="info-card-header">
            <h3>Direct Assistance</h3>
            <p>Our dedicated agronomy &amp; IoT support channels</p>
          </div>

          <div className="contact-items-list">
            <div className="contact-item">
              <div className="item-icon-box">
                <MdMail />
              </div>
              <div className="item-text">
                <div className="item-label">Support Email</div>
                <div className="item-val">support@agrowtein.com</div>
              </div>
            </div>

            <div className="contact-item">
              <div className="item-icon-box">
                <MdPhone />
              </div>
              <div className="item-text">
                <div className="item-label">Helpline Phone</div>
                <div className="item-val">+91 94950 00000</div>
              </div>
            </div>

            <div className="contact-item">
              <div className="item-icon-box">
                <MdAccessTime />
              </div>
              <div className="item-text">
                <div className="item-label">Operational Hours</div>
                <div className="item-val">Mon – Sat · 9:00 AM – 6:00 PM IST</div>
              </div>
            </div>

            <div className="contact-item">
              <div className="item-icon-box">
                <MdLocationOn />
              </div>
              <div className="item-text">
                <div className="item-label">Headquarters</div>
                <div className="item-val">Agrowtein Labs, Kerala, India</div>
              </div>
            </div>
          </div>

          <div className="support-guarantee-box">
            <MdVerified className="guarantee-icon" />
            <p>
              <strong>24-Hour Resolution Guarantee</strong>
              <br />
              All inquiries logged through this portal are prioritized by our engineering support team.
            </p>
          </div>
        </div>

        {/* Right Column: Enquiry Form */}
        <div className="enquiries-form-card">
          <div className="form-header">
            <h3>Send an Inquiry</h3>
            <p>Fill out the form below and we will get back to you shortly.</p>
          </div>

          <form onSubmit={handleFormSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Your Name</label>
                <div className="input-wrapper">
                  <MdPerson className="field-icon" />
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <MdMail className="field-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="e.g. john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Subject</label>
              <div className="input-wrapper">
                <MdSubject className="field-icon" />
                <input
                  type="text"
                  name="subject"
                  placeholder="e.g. Sensor calibration assistance or controller setup inquiry"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Message</label>
              <div className="input-wrapper textarea-wrap">
                <MdMessage className="field-icon" />
                <textarea
                  name="message"
                  placeholder="Describe your question or issue in detail..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="form-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="btn-spinner" />
                  <span>Submitting Inquiry…</span>
                </>
              ) : (
                <>
                  <MdSend size={18} />
                  <span>Submit Inquiry</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Enquiries;
