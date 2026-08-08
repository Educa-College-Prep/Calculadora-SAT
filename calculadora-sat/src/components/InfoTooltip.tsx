import { useState } from 'react';

interface Props {
  texto: string;
}

/**
 * Bolita pequeña con "?" que muestra un texto de ayuda al pasar el mouse (hover)
 * o al hacer clic/tap (para que funcione bien en móvil también).
 */
export function InfoTooltip({ texto }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', marginLeft: '6px', verticalAlign: 'middle' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span
        onClick={(e) => {
          e.stopPropagation();
          setVisible((v) => !v);
        }}
        style={{
          width: '15px',
          height: '15px',
          borderRadius: '50%',
          backgroundColor: '#94a3b8',
          color: '#fff',
          fontSize: '10px',
          fontWeight: 'bold',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'help',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        ?
      </span>

      {visible && (
        <span
          style={{
            position: 'absolute',
            bottom: '135%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#0f172a',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'normal',
            lineHeight: 1.4,
            width: 'max-content',
            maxWidth: '230px',
            textAlign: 'left',
            zIndex: 50,
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            whiteSpace: 'normal',
          }}
        >
          {texto}
          <span
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid #0f172a',
            }}
          />
        </span>
      )}
    </span>
  );
}
