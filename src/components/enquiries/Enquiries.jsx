import { useState } from "react";
import {
  MdMail,
  MdPerson,
  MdSubject,
  MdMessage,
  MdSend,
} from "react-icons/md";
import Swal from "sweetalert2";
import emailjs from "emailjs-com";
import "./Enquiries.scss";

const Enquiries = () => {
  const [formStatus] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const JSON_BLOB_URL = `${import.meta.env.VITE_ENQUIRY_API_URL}`;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newMessage = Object.fromEntries(formData);

    try {
      const response = await fetch(JSON_BLOB_URL);
      const existingData = await response.json();

      const updatedData = Array.isArray(existingData)
        ? [...existingData, newMessage]
        : [newMessage];

      await fetch(JSON_BLOB_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      await emailjs.send(
        "service_m88uuog",
        "template_vh789hg",
        {
          name: newMessage.name,
          email: newMessage.email,
          subject: newMessage.subject,
          message: newMessage.message,
        },
        import.meta.env.VITE_EMAILJS_USER_ID
      );

      setMessageSent(true);
      e.target.reset();

      Swal.fire({
        icon: "success",
        title: "Message Sent",
        text: "Your message has been sent successfully!",
        position: "center",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Something went wrong. Please try again later.",
        position: "center",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  return (
    <div className="enquiries-page">
      <div className="enquiries-header">
        <h1>Enquiries</h1>
        <p>We are here to help. Please submit your enquiries below.</p>
      </div>

      <div className="enquiries-form">
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <MdPerson className="form-icon" />
            <input type="text" name="name" placeholder="Your Name" required />
          </div>

          <div className="form-group">
            <MdMail className="form-icon" />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              required
            />
          </div>

          <div className="form-group">
            <MdSubject className="form-icon" />
            <input
              type="text"
              name="subject"
              placeholder="Subject"
              required
            />
          </div>

          <div className="form-group">
            <MdMessage className="form-icon" />
            <textarea
              name="message"
              placeholder="Your Message"
              required
            ></textarea>
          </div>

          <button type="submit" className="form-button">
            <MdSend size={18} style={{ marginRight: "8px" }} />
            Submit
          </button>
        </form>

        {formStatus && (
          <p className={`form-status ${messageSent ? "success" : ""}`}>
            {formStatus}
          </p>
        )}
      </div>
    </div>
  );
};

export default Enquiries;
