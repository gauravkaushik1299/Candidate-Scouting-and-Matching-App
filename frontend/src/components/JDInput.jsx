import { useState } from "react";

function JDInput({ onSubmit, loading = false }) {
  const [text, setText] = useState("");

  return (
    <form
      className="jd-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(text.trim());
      }}
    >
      <div className="jd-form__label-row">
        <label className="jd-form__label" htmlFor="job-description">Job description</label>
        <span className="jd-form__hint">Include role, key skills, and years of experience</span>
      </div>
      <textarea
        id="job-description"
        className="textarea"
        rows="5"
        aria-label="Job description"
        placeholder="Add your job description here…"
        value={text}
        disabled={loading}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="jd-form__footer">
        <span className="jd-form__tip">More specific requirements help rank profiles more clearly.</span>
        <button className="button" type="submit" disabled={loading || !text.trim()}>
          {loading ? "Analyzing…" : "Find candidates"}
          {!loading && <span className="button-arrow" aria-hidden="true">→</span>}
        </button>
      </div>
    </form>
  );
}

export default JDInput;

