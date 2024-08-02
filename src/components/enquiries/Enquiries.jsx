import React, { useContext, useState } from 'react';
import { SidebarContext } from '../../context/SidebarContext';
import { MdMail, MdPerson, MdSubject, MdMessage } from 'react-icons/md';
import "./Enquiries.scss";

const Enquiries = () => {
  const { closeSidebar } = useContext(SidebarContext);
  const [formStatus, setFormStatus] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      name: e.target.name.value,
      email: e.target.email.value,
      subject: e.target.subject.value,
      message: e.target.message.value,
    };

    try {
      // Replace the URL with your server endpoint
      const response = await fetch('https://your-server-endpoint.com/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormStatus('Enquiry submitted successfully!');
        e.target.reset(); // Reset the form after successful submission
      } else {
        setFormStatus('Failed to submit enquiry. Please try again.');
      }
    } catch (error) {
      setFormStatus('An error occurred. Please try again.');
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
        {formStatus && <p className="form-status">{formStatus}</p>}
      </div>
    </div>
  );
};

export default Enquiries;
