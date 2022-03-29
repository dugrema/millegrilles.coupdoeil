import React, {useState, useEffect, useCallback} from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'

export function AlertTimeout(props) {

    const message = props.message,
          setMessage = props.setMessage,
          setError = props.setError,
          err = props.err,
          delay = props.delay || 10000,
          variant = props.variant || 'success'

    const [timeoutSucces, setTimeoutSucces] = useState('')

    const titre = err?'Erreur':'Success'

    const closeCb = useCallback(()=>{
        if(setError) setError('')
        setMessage('')
    }, [setMessage, setError])

    useEffect(()=>{
        if(delay && message && !timeoutSucces) {
            // Activer timeout
            setTimeoutSucces(setTimeout(()=>setMessage(''), delay))
        }
    }, [message, timeoutSucces, setTimeoutSucces, delay])

    useEffect(()=>{
        if(!message && timeoutSucces) {
            // Desactiver timeout
            clearTimeout(timeoutSucces)
            setTimeoutSucces('')
        }
    }, [message, timeoutSucces, setTimeoutSucces, delay])

    return (
        <Alert show={message?true:false} variant={variant} onClose={closeCb} dismissible>
            <Alert.Heading>{titre}</Alert.Heading>
            {message}
            <ShowStackTrace err={err} />
        </Alert>
    )
}

function ShowStackTrace(props) {
    const err = props.err

    if(!err) return ''

    let stack = ''
    if(err.stack) {
        console.debug("Stack : %O", err.stack)
        stack = (
            <>
                <p>{''+err}</p>
                <pre>{err.stack}</pre>
            </>
        )
    } else {
        stack = <p>{''+err}</p>
    }

    return (
        <>
            <p>Stack trace</p>
            <pre className="stack">{stack}</pre>
        </>
    )
}

export function ModalAttente(props) {

    const show = props.show,
          setAttente = props.setAttente

    const [timerOuverture, setTimerOuverture] = useState()
    const [actif, setActif] = useState(false)

    useEffect(()=>{
        if(show && !timerOuverture) {
            setTimeout(()=>setActif(true), 250)
        } else if(!show && timerOuverture) {
            clearTimeout(timerOuverture)
            setTimerOuverture(null)
        }
    }, [timerOuverture, setTimerOuverture, show, setActif])

    useEffect(()=>{
        if(!show && actif) {
            setActif(false)
        }
    }, [actif, show, setActif])

    return (
        <Modal show={actif}>
            <Modal.Header>En cours...</Modal.Header>
            <Modal.Footer>
                <Button disabled={!setAttente} variant="secondary" onClick={()=>setAttente(false)}>Annuler</Button>
            </Modal.Footer>
        </Modal>
    )

}
