from langdetect import DetectorFactory, LangDetectException, detect

DetectorFactory.seed = 0  # deterministic output


def detect_language(text: str) -> str | None:
    sample = text.strip()[:2000]
    if not sample:
        return None

    # langdetect's statistical model is trained on Latin-heavy corpora and
    # is unreliable on Sinhala/Tamil; script ranges are a much stronger
    # signal for those two, so check codepoints before falling back.
    if any("඀" <= ch <= "෿" for ch in sample):
        return "si"
    if any("஀" <= ch <= "௿" for ch in sample):
        return "ta"

    try:
        return detect(sample)
    except LangDetectException:
        return None
