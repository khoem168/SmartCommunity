import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { FiAward, FiCheckCircle, FiCopy, FiPrinter, FiXCircle } from "react-icons/fi";
import logo from "../../assets/logo/logo-mark.png";
import { fetchCertificate } from "../../services/courseService";
import { useLanguage } from "../../context/LanguageContext";
import { CardSkeleton } from "../../components/ui/LoadingStates";
import "./CertificatePage.css";

const copy = {
  km: {
    verified: "វិញ្ញាបនបត្រនេះពិតប្រាកដ ហើយត្រូវបានចេញដោយ Smart Community។",
    notFound: "រកមិនឃើញវិញ្ញាបនបត្រនេះទេ។ សូមពិនិត្យលេខកូដម្តងទៀត។",
    print: "បោះពុម្ព / រក្សាទុកជា PDF",
    printHint: "នៅក្នុងផ្ទាំងបោះពុម្ព ជ្រើស “Save as PDF” ដើម្បីទាញយក។",
    copyLink: "ចម្លងតំណ",
    copied: "បានចម្លង",
    back: "ទៅវគ្គសិក្សា",
  },
  en: {
    verified: "This certificate is genuine and was issued by Smart Community.",
    notFound: "We couldn't find this certificate. Check the code and try again.",
    print: "Print / Save as PDF",
    printHint: "In the print window, choose “Save as PDF” to download it.",
    copyLink: "Copy link",
    copied: "Copied",
    back: "Go to course",
  },
};

const CertificatePage = () => {
  const { code } = useParams();
  const { language } = useLanguage();
  const text = copy[language === "en" ? "en" : "km"];
  const [state, setState] = useState({ loading: true, certificate: null, error: false });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCertificate(code)
      .then((data) => { if (!cancelled) setState({ loading: false, certificate: data.certificate, error: false }); })
      .catch(() => { if (!cancelled) setState({ loading: false, certificate: null, error: true }); });
    return () => { cancelled = true; };
  }, [code]);

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (state.loading) {
    return <main className="certificate-page"><div className="container"><CardSkeleton /></div></main>;
  }
  if (state.error || !state.certificate) {
    return (
      <main className="certificate-page">
        <div className="container certificate-missing">
          <FiXCircle aria-hidden="true" />
          <p>{text.notFound}</p>
          <Link to="/courses" className="btn primary">{language === "en" ? "Browse courses" : "មើលវគ្គសិក្សា"}</Link>
        </div>
      </main>
    );
  }

  const { certificate } = state;
  const issued = new Date(certificate.issuedAt);
  const issuedEn = issued.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const issuedKm = issued.toLocaleDateString("km-KH", { day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="certificate-page">
      <div className="container">
        <div className="certificate-toolbar no-print">
          <p className="certificate-verified" role="status"><FiCheckCircle /> {text.verified}</p>
          <div className="certificate-actions">
            <button type="button" className="btn primary" onClick={() => window.print()}><FiPrinter /> {text.print}</button>
            <button type="button" className="btn" onClick={copyLink}><FiCopy /> {copied ? text.copied : text.copyLink}</button>
            <Link to={`/courses/${certificate.course.slug}`} className="btn">{text.back}</Link>
          </div>
          <small>{text.printHint}</small>
        </div>

        {/* The certificate itself: bilingual so it works for local and international readers. */}
        <article className="certificate-sheet" aria-label="Certificate of completion">
          <div className="certificate-border">
            <header className="certificate-header">
              <img src={logo} alt="" />
              <div>
                <strong>Smart Community</strong>
                <span>Skill &amp; Career Development Platform</span>
              </div>
            </header>

            <p className="certificate-kicker"><FiAward /> វិញ្ញាបនបត្របញ្ចប់វគ្គសិក្សា · Certificate of Completion</p>
            <p className="certificate-presented">សូមបញ្ជាក់ថា · This certifies that</p>
            <h1 className="certificate-name">{certificate.recipient}</h1>
            <p className="certificate-presented">បានបញ្ចប់វគ្គសិក្សាដោយជោគជ័យ · has successfully completed</p>
            <h2 className="certificate-course">{certificate.course.title}</h2>
            <p className="certificate-meta">
              {certificate.course.lessons} lessons
              {certificate.course.duration ? ` · ${certificate.course.duration}` : ""}
              {certificate.course.level ? ` · ${certificate.course.level}` : ""}
            </p>

            <footer className="certificate-footer">
              <div>
                <small>កាលបរិច្ឆេទ · Date</small>
                <strong>{issuedKm}</strong>
                <span>{issuedEn}</span>
              </div>
              <div className="certificate-seal" aria-hidden="true"><FiAward /></div>
              <div className="certificate-verify">
                <QRCodeSVG value={pageUrl} size={84} marginSize={1} title="Verify certificate" />
                <div>
                  <small>លេខកូដផ្ទៀងផ្ទាត់ · Verify</small>
                  <strong>{certificate.code}</strong>
                </div>
              </div>
            </footer>
          </div>
        </article>
      </div>
    </main>
  );
};

export default CertificatePage;
