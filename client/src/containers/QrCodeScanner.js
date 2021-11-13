import React, {useState, useEffect} from 'react'
// import QRCode from 'qrcode.react'
import { QrReader } from '@blackbox-vision/react-qr-reader';

export function QrCodeScanner(props) {

  const {handleScan, handleError} = props

  if(!props.show) return <p>QR Reader inactif</p>

  return (
    <>
      <p>Le reader</p>
      <QrReader
        constraints={{ facingMode: 'environment' }}
        scanDelay={300}
        onResult={(result, error) => {
          if (!!result) {
            handleScan(result?.text)
          }
          if (!!error && handleError) {
            handleError(error)
          }
        }}
        style={{ width: '75%', 'text-align': 'center' }}
      />
      <p>C'etait le reader</p>
    </>
  )
}

export function parseCsrQr(data) {
  const dataB64 = btoa(data)
  const pem = `-----BEGIN CERTIFICATE REQUEST-----\n${dataB64}\n-----END CERTIFICATE REQUEST-----`
  return pem
}