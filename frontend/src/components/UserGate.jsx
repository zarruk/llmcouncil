import { useState } from 'react';
import './UserGate.css';

const COUNTRY_OPTIONS = [
  {
    label: 'Colombia',
    countryCode: '+57',
    flag: '🇨🇴',
    example: '3112345678',
  },
  {
    label: 'México',
    countryCode: '+52',
    flag: '🇲🇽',
    example: '5512345678',
  },
  {
    label: 'Estados Unidos',
    countryCode: '+1',
    flag: '🇺🇸',
    example: '4155552671',
  },
  {
    label: 'Argentina',
    countryCode: '+54',
    flag: '🇦🇷',
    example: '1123456789',
  },
];

export default function UserGate({ onSubmit, isSubmitting = false }) {
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState(COUNTRY_OPTIONS[0].countryCode);
  const [phoneNumber, setPhoneNumber] = useState('');

  const selectedCountry = COUNTRY_OPTIONS.find(
    (option) => option.countryCode === countryCode
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) {
      return;
    }
    await onSubmit({
      name: name.trim(),
      countryCode,
      phoneNumber: phoneNumber.trim(),
    });
  };

  return (
    <div className="user-gate">
      <div className="user-gate-card">
        <h2>Un paso más antes de comenzar</h2>
        <p className="user-gate-subtitle">
          Cuéntanos tu nombre y número con código de área (por defecto Colombia).
        </p>
        <form className="user-gate-form" onSubmit={handleSubmit}>
          <label htmlFor="user-name">Nombre</label>
          <input
            id="user-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ingresa tu nombre completo"
            disabled={isSubmitting}
            required
          />

          <label htmlFor="country-code">Código de área</label>
          <select
            id="country-code"
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value)}
            disabled={isSubmitting}
          >
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.countryCode} value={option.countryCode}>
                {`${option.flag} ${option.label} (${option.countryCode})`}
              </option>
            ))}
          </select>

          <label htmlFor="phone-number">Número de teléfono</label>
          <input
            id="phone-number"
            type="tel"
            inputMode="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder={selectedCountry?.example || '3112345678'}
            disabled={isSubmitting}
            required
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}

