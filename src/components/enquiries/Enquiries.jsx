import React, { useState } from "react";
import { MdMail, MdPerson, MdSubject, MdMessage } from "react-icons/md";
import "./Enquiries.scss";
import Swal from "sweetalert2";

const Enquiries = () => {
  const [formStatus, setFormStatus] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  // The URL of the existing JSON Blob
  const JSON_BLOB_URL = "https://jsonblob.com/api/jsonBlob/1330617753689841664";

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Extract form data
    const formData = new FormData(e.target);
    const newMessage = Object.fromEntries(formData);

    try {
      // Step 1: Fetch existing data from the blob
      const response = await fetch(JSON_BLOB_URL);
      if (!response.ok) throw new Error("Failed to fetch existing data");

      const existingData = await response.json();

      // Ensure the existing data is an array (handle cases where the blob is empty or not initialized as an array)
      const updatedData = Array.isArray(existingData)
        ? [...existingData, newMessage]
        : [newMessage];

      // Step 2: Update the blob with the new data
      const updateResponse = await fetch(JSON_BLOB_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!updateResponse.ok) throw new Error("Failed to update the blob");

      // Step 3: Success feedback
      setFormStatus("Message sent successfully!");
      setMessageSent(true);

      // Reset the form
      e.target.reset();

      Swal.fire({
        icon: "success",
        title: "Message Sent",
        text: "Your message has been sent successfully!",
        position: "center",
        showConfirmButton: false,
        timer: 1500,
      });

      // // Automatically clear the success message after 2 seconds
      // setTimeout(() => {
      //   setMessageSent(false);
      //   setFormStatus("");
      // }, 2000);
    } catch (error) {
      console.error(error);
      setFormStatus("An error occurred. Please try again later.");
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
        {/* {formStatus && (
          <p className={`form-status ${messageSent ? "success" : ""}`}>
            {formStatus}
          </p>
        )} */}
      </div>
    </div>
  );
};

export default Enquiries;
