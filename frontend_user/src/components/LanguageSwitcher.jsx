import { useLanguage } from "../context/LanguageContext";
import englishIcon from "../assets/icons/english.png";
import khmerIcon from "../assets/icons/khmer.png";

const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage();
  const languages = [
    {
      code: "en",
      icon: englishIcon,
      label: "EN",
      title: t("language.english"),
    },
    {
      code: "km",
      icon: khmerIcon,
      label: "ខ្មែរ",
      title: t("language.khmer"),
    },
  ];

  return (
    <div
      className="language-switcher"
      role="group"
      aria-label={t("language.label")}
    >
      {languages.map((item) => (
        <button
          key={item.code}
          type="button"
          className={language === item.code ? "active" : ""}
          aria-pressed={language === item.code}
          aria-label={item.title}
          title={item.title}
          onClick={() => setLanguage(item.code)}
        >
          <img className="language-flag" src={item.icon} alt="" />
          <span className="language-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
