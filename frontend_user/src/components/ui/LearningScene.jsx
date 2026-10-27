import { FiCode, FiBookOpen, FiUsers, FiArrowUpRight } from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";
import "./LearningScene.css";

// A local, decorative CSS illustration: no remote images or WebGL dependency.
export default function LearningScene() {
  const { language } = useLanguage();
  const khmer = language === "km";
  return (
    <div className="learning-scene" role="img" aria-label={khmer
      ? "រូបភាព 3D នៃកុំព្យូទ័រ សៀវភៅ និងការរៀនជាមួយគ្នា"
      : "3D illustration of a coding laptop, books and collaborative learning"}>
      <div className="scene-art" aria-hidden="true">
        <div className="scene-orbit orbit-one" />
        <div className="scene-orbit orbit-two" />
        <div className="scene-floor" />
        <div className="scene-sphere" />
        <div className="scene-spark spark-one">✦</div>
        <div className="scene-spark spark-two">✦</div>
        <div className="scene-laptop">
          <div className="laptop-display">
            <div className="editor-toolbar"><span /><span /><span /><small>hello-future.js</small></div>
            <div className="editor-content">
              <span className="editor-comment">// learn. build. grow.</span>
              <span><b>const</b> future = {"{"}</span>
              <span className="editor-indent">skills: <em>'limitless'</em>,</span>
              <span className="editor-indent">community: <em>true</em>,</span>
              <span className="editor-indent">next: <em>'you'</em></span>
              <span>{"};"}</span>
              <span className="editor-run">↗ buildYourFuture();</span>
            </div>
          </div>
          <div className="laptop-base"><i /><span /></div>
        </div>
        <div className="scene-book book-back"><FiBookOpen /></div>
        <div className="scene-book book-front"><FiCode /></div>
        <div className="scene-note note-code">
          <span className="scene-note-icon"><FiCode /></span>
          <div><strong>{khmer ? "ពីគំនិត ទៅជាស្នាដៃ" : "Ideas into real projects"}</strong><small>Learn by building</small></div>
        </div>
        <div className="scene-note note-community">
          <span className="scene-note-icon"><FiUsers /></span>
          <div><strong>{khmer ? "រីកចម្រើនជាមួយគ្នា" : "Better, together"}</strong><small>{khmer ? "រៀន • ចែករំលែក • ភ្ជាប់ទំនាក់ទំនង" : "Learn • Share • Connect"}</small></div>
          <FiArrowUpRight />
        </div>
        <span className="scene-caption">YOUR NEXT CHAPTER STARTS HERE</span>
      </div>
    </div>
  );
}
