import React, { useState } from 'react';
import { MdMail, MdPerson, MdSubject, MdMessage } from 'react-icons/md';
import "./Enquiries.scss";

const Enquiries = () => {
  const [formStatus, setFormStatus] = useState('');
  const [messageSent, setMessageSent] = useState(false); // To manage "Message sent" feedback

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Set the form status directly without making any backend request
    setFormStatus('Message sent successfully!');
    setMessageSent(true); // Set message sent flag to true

    // Reset the form after successful submission
    e.target.reset();

    // Automatically remove the success message after 2 seconds
    setTimeout(() => {
      setMessageSent(false); // Hide the message
      setFormStatus(''); // Clear the form status
    }, 2000); // 2000ms = 2 seconds
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
            <input type="email" name="email" placeholder="Your Email" required />
          </div>
          <div className="form-group">
            <MdSubject className="form-icon" />
            <input type="text" name="subject" placeholder="Subject" required />
          </div>
          <div className="form-group">
            <MdMessage className="form-icon" />
            <textarea name="message" placeholder="Your Message" required></textarea>
          </div>
          <button type="submit" className="form-button">Submit</button>
        </form>
        {formStatus && (
          <p className={`form-status ${messageSent ? 'success' : ''}`}>
            {formStatus}
          </p>
        )}
      </div>
    </div>
  );
};

export default Enquiries;
