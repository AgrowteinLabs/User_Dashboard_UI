import { useRef } from "react";
import PropTypes from "prop-types";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import SensorInsightsChart from "./SensorInsightsChart";
import { motion } from "framer-motion";
import {
  FaLightbulb,
  FaChartLine,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaChartArea,
  FaCheckCircle
} from "react-icons/fa";

import "./AiAssistant.scss";

const ReportDisplay = ({ report, uid }) => {
  const reportRef = useRef();

  const handleDownloadPDF = async () => {
    const input = reportRef.current;

    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Grobo_Report_${uid}.pdf`);
  };

  const iconMap = {
    insights: <FaLightbulb style={{ marginRight: "8px", color: "#10b981" }} />,
    prediction: <FaChartLine style={{ marginRight: "8px", color: "#10b981" }} />,
    recommendations: <FaClipboardCheck style={{ marginRight: "8px", color: "#10b981" }} />,
    drawbacks: <FaExclamationTriangle style={{ marginRight: "8px", color: "#f59e0b" }} />,
    trend_summary: <FaChartArea style={{ marginRight: "8px", color: "#10b981" }} />,
  };

  return (
    <motion.div
      className="report-section"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="report-header">
        <h3>📊 Grobo AI Report</h3>
        <button className="download-btn" onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>

      <div className="report-content" ref={reportRef}>
        {["insights", "prediction", "recommendations", "drawbacks", "trend_summary"].map(
          (key) => (
            <motion.div
              key={key}
              className="report-block"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h4>
                {iconMap[key]}
                {key.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
              </h4>
              <p>{report[key]}</p>
            </motion.div>
          )
        )}

        <motion.div
          className="report-block success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h4>
            <FaCheckCircle style={{ marginRight: "8px", color: "#16a34a" }} />
            Success %
          </h4>
          <p>{report.success_percentage}</p>
        </motion.div>

        <SensorInsightsChart uid={uid} optimalRanges={report.sensor_optimal} />
      </div>
    </motion.div>
  );
};

ReportDisplay.propTypes = {
  report: PropTypes.shape({
    insights: PropTypes.string,
    prediction: PropTypes.string,
    recommendations: PropTypes.string,
    drawbacks: PropTypes.string,
    trend_summary: PropTypes.string,
    success_percentage: PropTypes.string,
    sensor_optimal: PropTypes.object,
  }).isRequired,
  uid: PropTypes.string.isRequired,
};

export default ReportDisplay;
