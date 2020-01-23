import React from 'react';
import { Form, InputGroup, Row, Col} from 'react-bootstrap';
import { Trans } from 'react-i18next';

//
// props :
//  - contenu
//  - languePrincipale
//  - languesAdditionnelles
//  - controlId
//  - valuePrefix
//  - onChange
//  - placeholder
//  - rows  (nombre - indique textearea)
export function InputTextMultilingue(props) {

  // Extraire props
  const contenu = props.contenu;
  const onChange = props.onChange;
  const languePrincipale = props.languePrincipale;
  const languesAdditionnelles = props.languesAdditionnelles;
  const controlId = props.controlId;
  const valuePrefix = props.valuePrefix;
  const placeholder = props.placeholder;
  const rows = props.rows;

  const listeLangues = [languePrincipale, ...languesAdditionnelles];

  const inputList = listeLangues.map(l=>{
    let suffixe = '', languePrepend = 'langues.' + l;
    if(l!==languePrincipale) {
      suffixe = '_' + l;
    }

    var valeur = '';
    if(contenu) {
      valeur = contenu[valuePrefix + suffixe] || '';
    }

    // Determiner si on a un TextArea ou Input Text
    let formControl;
    if(rows) {
      formControl = (
        <Form.Control name={valuePrefix + suffixe}
                      value={valeur}
                      onChange={onChange}
                      placeholder={placeholder}
                      as="textarea" rows={rows} />
      );
    } else {
      formControl = (
        <Form.Control name={valuePrefix + suffixe}
                      value={valeur}
                      onChange={onChange}
                      placeholder={placeholder} />
      );
    }

    return (
      <Form.Group key={languePrepend} controlId={props.controlId + suffixe}>
        <InputGroup className="mb-3">
          <InputGroup.Prepend>
            <InputGroup.Text>
              <Trans>{languePrepend}</Trans>
            </InputGroup.Text>
          </InputGroup.Prepend>
          {formControl}
        </InputGroup>
      </Form.Group>
    );
  })

  return inputList;

}
