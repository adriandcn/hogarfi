'use client'

export default function CopyButton({ link, name }: { link: string; name: string }) {
  const url = 'https://wa.me/?text=' + encodeURIComponent('Hola ' + name + '! Unete a nuestro hogar en HogarFi: ' + link)
  
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: 'block', background: '#25D366', color: '#fff', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
      Enviar por WhatsApp
    </a>
  )
}