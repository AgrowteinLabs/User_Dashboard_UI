import React, { useState } from "react";
import { MdMail, MdPerson, MdSubject, MdMessage } from "react-icons/md";
import Swal from "sweetalert2";
import emailjs from "emailjs-com";
import "./Enquiries.scss";

const Enquiries = () => {
  const [formStatus, setFormStatus] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const JSON_BLOB_URL = `${import.meta.env.VITE_ENQUIRY_API_URL}`;

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const newMessage = Object.fromEntries(formData);

    try {
      const response = await fetch(JSON_BLOB_URL);
      if (!response.ok) throw new Error("Failed to fetch existing data");

      const existingData = await response.json();

      const updatedData = Array.isArray(existingData)
        ? [...existingData, newMessage]
        : [newMessage];

      const updateResponse = await fetch(JSON_BLOB_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!updateResponse.ok) throw new Error("Failed to update the blob");

      let ejuserId = import.meta.env.VITE_EMAILJS_USER_ID;

      await emailjs.send(
        "service_m88uuog", //EmailJS service ID
        "template_vh789hg",//EmailJS template ID
        {
          name: newMessage.name,
          email: newMessage.email,
          subject: newMessage.subject,
          message: newMessage.message,
        },
        ejuserId
      );

      setMessageSent(true);

      e.target.reset();

      Swal.fire({
        icon: "success",
        title: "Message Sent",
        text: "Your message has been sent successfully!",
        position: "center",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred. Please try again later.",
        position: "center",
        showConfirmButton: false,
        timer: 1500,
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
            <input type="text" name="subject" placeholder="Subject" required />
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
