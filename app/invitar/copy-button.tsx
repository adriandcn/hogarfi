'use client'

export default function CopyButton({ link, name }: { link: string; name: string }) {
  const waUrl = `https://wa.me/?text=Hola ${name}! Te invito a unirte a nuestro hogar en HogarFi: ${encodeURIComponent(link)}`
  
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      
        href={waUrl}
        target="_blank"
        rel="noreferrer"
        style={{ flex: 1, background: '#25D366', color: '#fff', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        Enviar por WhatsApp
      </a>
    </div>
  )
}