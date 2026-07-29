import React from 'react';

export default function Toggle({ checked, onChange, id }) {
  return (
    <label className="pb-switch" htmlFor={id} title={checked ? 'Click to skip this section' : 'Click to include this section'}>
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}/>
      <span className="pb-switch-track"/>
      <span className="pb-switch-thumb"/>
    </label>
  );
}
