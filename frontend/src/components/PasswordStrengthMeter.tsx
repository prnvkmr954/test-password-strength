'use client';

import { useMemo } from 'react';

type Rule = {
  label: string;
  test: (pw: string) => boolean;
};

const rules: Rule[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter (A-Z)', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter (a-z)', test: (pw) => /[a-z]/.test(pw) },
  { label: 'One digit (0-9)', test: (pw) => /[0-9]/.test(pw) },
  { label: 'One special character (!@#$...)', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Excellent'];

export default function PasswordStrengthMeter({ password }: { password: string }) {
  const results = useMemo(
    () => rules.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password]
  );

  const score = results.filter((r) => r.passed).length;

  if (!password) return null;

  return (
    <div className="strength-meter">
      <div className="strength-bar-bg">
        <div className={`strength-bar-fill score-${score}`} />
      </div>
      <div className={`strength-label score-${score}`}>
        {strengthLabels[score]}
      </div>
      <div className="strength-rules">
        {results.map((rule, i) => (
          <div key={i} className={`strength-rule ${rule.passed ? 'passed' : ''}`}>
            <span className="strength-rule-icon">
              {rule.passed ? '✓' : '○'}
            </span>
            {rule.label}
          </div>
        ))}
      </div>
    </div>
  );
}
