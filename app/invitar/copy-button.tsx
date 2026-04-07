'use client'

export default function CopyButton({ link, name }: { link: string; name: string }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      
        href={`https://wa.me/?text=Hola ${name}! Te invito a unirte a nuestro hogar en HogarFi: ${encodeURIComponent(link)}`}
        target="_blank"
        style={{ flex: 1, background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        📱 Enviar por WhatsApp
      </a>
    </div>
  )
}