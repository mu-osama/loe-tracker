'use client';

import {
  Children,
  ChangeEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  SelectHTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  placeholder?: string;
};

function extractOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];

  Children.forEach(children, (child) => {
    if (!child || typeof child !== 'object' || !('props' in child) || !('type' in child)) {
      return;
    }

    const node = child as {
      type?: string;
      props?: {
        value?: string | number;
        disabled?: boolean;
        children?: ReactNode;
      };
    };

    if (node.type === 'option') {
      const label = Children.toArray(node.props?.children).join('').trim();
      options.push({
        value: String(node.props?.value ?? ''),
        label,
        disabled: node.props?.disabled,
      });
      return;
    }

    if (node.props?.children) {
      options.push(...extractOptions(node.props.children));
    }
  });

  return options;
}

export function Select({
  className = '',
  children,
  value,
  onChange,
  disabled,
  placeholder,
  ...props
}: SelectProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const options = useMemo(() => extractOptions(children), [children]);
  const normalizedValue = value === undefined || value === null ? '' : String(value);
  const selectedOption = options.find((option) => option.value === normalizedValue);
  const placeholderLabel = placeholder || options.find((option) => option.value === '')?.label || 'Select option';

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function commit(valueToSet: string) {
    onChange?.({
      target: { value: valueToSet },
      currentTarget: { value: valueToSet },
    } as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  }

  function handleTriggerClick() {
    if (disabled) return;
    setOpen((current) => !current);
  }

  function handleOptionClick(event: ReactMouseEvent<HTMLButtonElement>, option: SelectOption) {
    event.preventDefault();
    if (option.disabled) return;
    commit(option.value);
  }

  return (
    <div ref={wrapperRef} className={`select-shell ${className}`.trim()}>
      <select
        {...props}
        value={normalizedValue}
        onChange={onChange}
        disabled={disabled}
        className="select-native"
        tabIndex={-1}
        aria-hidden="true"
      >
        {children}
      </select>

      <button
        type="button"
        className={`select ${open ? 'open' : ''}`.trim()}
        onClick={handleTriggerClick}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selectedOption ? 'select-value' : 'select-placeholder'}>
          {selectedOption?.label || placeholderLabel}
        </span>
        <span className="select-caret">{open ? '▴' : '▾'}</span>
      </button>

      {open ? (
        <div className="select-popover">
          <div className="select-options" role="listbox">
            {options.length ? (
              options.map((option) => (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  className={`select-option ${option.value === normalizedValue ? 'selected' : ''}`.trim()}
                  onClick={(event) => handleOptionClick(event, option)}
                  disabled={option.disabled}
                >
                  <span>{option.label}</span>
                  {option.value === normalizedValue ? <span className="select-option-check">✓</span> : null}
                </button>
              ))
            ) : (
              <div className="select-empty">No options available</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
