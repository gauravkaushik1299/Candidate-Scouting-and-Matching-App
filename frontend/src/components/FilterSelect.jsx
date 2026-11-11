import { useEffect, useId, useRef, useState } from "react";

function FilterSelect({ label, value, options, disabled = false, onChange }) {
  const id = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (!open) return undefined;
    optionRefs.current[activeIndex]?.focus();
    const closeOnOutsidePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open, activeIndex]);

  const openAt = (index) => {
    setActiveIndex(Math.min(Math.max(index, 0), options.length - 1));
    setOpen(true);
  };

  const selectOption = (option) => {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openAt(selectedIndex);
    }
  };

  const handleListKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => (index + direction + options.length) % options.length);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectOption(options[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div
      className={`filter-select ${open ? "is-open" : ""}`}
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <span className="filter-select__label" id={`${id}-label`}>{label}</span>
      <button
        className="filter-select__trigger"
        type="button"
        ref={triggerRef}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => open ? setOpen(false) : openAt(selectedIndex)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span id={`${id}-value`}>{selectedOption?.label || "Choose"}</span>
        <span className="filter-select__chevron" aria-hidden="true" />
      </button>
      {open && !disabled && (
        <div className="filter-select__menu" id={`${id}-options`} role="listbox" aria-labelledby={`${id}-label`} onKeyDown={handleListKeyDown}>
          {options.map((option, index) => (
            <button
              className={`filter-select__option ${option.value === value ? "is-selected" : ""} ${index === activeIndex ? "is-active" : ""}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              tabIndex={index === activeIndex ? 0 : -1}
              ref={(element) => { optionRefs.current[index] = element; }}
              key={option.value || "all"}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectOption(option)}
            >
              <span>{option.label}</span>
              {option.value === value && <span className="filter-select__check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterSelect;
