import { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';

/** Separators for lists of email addresses: commas, semicolons or spaces. */
export const EMAIL_SEPARATORS = /[\s,;]+/;

export interface TagInputProps {
  /** Current tags */
  value?: string[];
  /** Called when tags change */
  onChange?: (tags: string[]) => void;
  /** Input placeholder */
  placeholder?: string;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Maximum length per tag */
  maxTagLength?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** What separates tags when typed or pasted (default: commas). Email lists also
   * split on spaces and semicolons. */
  separators?: RegExp;
  /** Custom class for the root container */
  className?: string;
  /** Badge variant for tags */
  variant?: 'default' | 'secondary' | 'outline';
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Type and press Enter',
  maxTags,
  maxTagLength = 100,
  disabled = false,
  className,
  variant = 'secondary',
  separators = /,/,
}: Readonly<TagInputProps>) {
  const [input, setInput] = useState('');

  const addTags = (raw: string) => {
    const candidates = raw
      .split(separators)
      .map((s) => s.trim().slice(0, maxTagLength))
      .filter(Boolean);
    if (candidates.length === 0) return;

    const unique = candidates.filter((t) => !value.includes(t));
    if (unique.length === 0) {
      setInput('');
      return;
    }

    const allowed = maxTags ? unique.slice(0, maxTags - value.length) : unique;
    if (allowed.length === 0) return;

    onChange?.([...value, ...allowed]);
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange?.(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || (e.key.length === 1 && separators.test(e.key))) {
      e.preventDefault();
      addTags(input);
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (separators.test(pasted.trim())) {
      e.preventDefault();
      addTags(pasted);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        // Typed text counts even without Enter: leaving the box (e.g. to click
        // Invite or Next) adds it, so nothing typed is silently dropped.
        onBlur={() => addTags(input)}
        placeholder={placeholder}
        disabled={disabled || (maxTags != null && value.length >= maxTags)}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant={variant} className="gap-1">
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {tag}</span>
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
