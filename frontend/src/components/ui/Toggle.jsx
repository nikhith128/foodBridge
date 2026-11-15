/**
 * Toggle
 *
 * A labelled on/off switch for the two settings surfaces (Edit Profile and
 * Settings). The Stitch screens show toggles but do not ship a component, so
 * this uses the token palette directly: secondary when on, outline-variant when
 * off, and a 20px knob that slides inside a 44×24px track.
 *
 * Controlled component: pass `checked` and `onChange(nextValue)`.
 */

export default function Toggle({ id, checked, onChange, label, description, disabled = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className={`font-label-md text-label-md ${
            disabled ? 'text-on-surface-variant' : 'text-on-surface'
          }`}
        >
          {label}
        </label>
        {description && (
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{description}</p>
        )}
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest ${
          checked ? 'bg-secondary' : 'bg-outline-variant'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface-container-lowest shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
