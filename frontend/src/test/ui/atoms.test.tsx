import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import {
  Button, Chip, CorpEmblem, Delta, ExpansionTags, Medal, medalMaterial, NumberField, PlayerTag, Readout, SectionHead,
  SelectField, Switch, Tabs, tabPanelProps, tabTarget, TextField, TierPips, clampInt,
} from '@/ui/atoms'

const facu = { id: 'p-facu', name: 'Facu', color: 'rojo' }

describe('Button', () => {
  it('solo ícono necesita label y lo expone como nombre', () => {
    render(<Button icon="close" label="Cerrar" />)
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
  })

  it('pressed y disabled llegan al botón', () => {
    const onClick = vi.fn()
    render(<><Button pressed onClick={onClick}>Ver tabla</Button><Button disabled onClick={onClick}>No</Button></>)
    expect(screen.getByRole('button', { name: 'Ver tabla' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('Delta', () => {
  it('null, positivo, negativo y cero', () => {
    const { container } = render(<><Delta value={null} /><Delta value={12} /><Delta value={-7} /><Delta value={0} /></>)
    expect(container.textContent).toBe('—▲+12▼−7■±0')
  })
})

describe('CorpEmblem', () => {
  it('desconocida no dibuja nada; conocida lleva la sigla y el nombre oculto', () => {
    const { container } = render(<><CorpEmblem name="No existe" /><CorpEmblem name="Point Luna" /></>)
    expect(container.querySelectorAll('[title]')).toHaveLength(1)
    expect(screen.getByText('PL')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Point Luna')).toHaveClass('vh')
  })

  it('pasa el tono como custom property (D-09)', () => {
    const { container } = render(<CorpEmblem name="Ecoline" withName />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--hue')).toBe('115')
  })
})

describe('Medal', () => {
  it('nivel 0 o bloqueada no tiene material; logro único usa oro', () => {
    expect(medalMaterial(1).token).toBe('steel')
    expect(medalMaterial(5).token).toBe('gaia')
    expect(medalMaterial(1, true).token).toBe('gold')
  })

  it('con label es una imagen', () => {
    render(<Medal glyph="trophy" tier={3} label="Nivel 3" />)
    expect(screen.getByRole('img', { name: 'Nivel 3' })).toBeInTheDocument()
  })
})

describe('TierPips, Readout, SectionHead, Chip, ExpansionTags', () => {
  it('rotulan su contenido', () => {
    render(<>
      <TierPips tier={3} max={5} />
      <Readout label="Partidas" value="38" sub="en total" />
      <SectionHead title="Botones" level={3}><span>aparte</span></SectionHead>
      <Chip icon="generation">11 generaciones</Chip>
      <ExpansionTags expansions={['Prelude', 'Venus next']} draft />
    </>)
    expect(screen.getByRole('img', { name: 'Nivel 3 de 5' }).children).toHaveLength(5)
    expect(screen.getByRole('heading', { level: 3, name: 'Botones' })).toBeInTheDocument()
    expect(screen.getByText('11 generaciones')).toBeInTheDocument()
    expect(screen.getByText('Venus Next')).toHaveClass('vh')
    expect(screen.getByTitle('Draft')).toBeInTheDocument()
  })
})

describe('PlayerTag', () => {
  function Profile() { return <p>perfil {useParams().id}</p> }

  it('abre el perfil del jugador', async () => {
    render(<MemoryRouter><Routes>
      <Route path="/" element={<PlayerTag player={facu} sub="1172" />} />
      <Route path="/jugadores/:id" element={<Profile />} />
    </Routes></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: /Facu/ }))
    expect(screen.getByText('perfil p-facu')).toBeInTheDocument()
  })

  it('sin link es texto y sin jugador no dibuja nada', () => {
    const { container } = render(<MemoryRouter><PlayerTag player={facu} link={false} /><PlayerTag player={null} /></MemoryRouter>)
    expect(screen.queryByRole('button')).toBeNull()
    expect(container.textContent).toBe('Facu')
  })
})

describe('Tabs', () => {
  const items = [{ id: 'a', label: 'Resumen' }, { id: 'b', label: 'Partidas', count: 38 }, { id: 'c', label: 'Logros' }]

  it('tabTarget: flechas con vuelta, Inicio y Fin', () => {
    expect([tabTarget('ArrowRight', 2, 3), tabTarget('ArrowLeft', 0, 3), tabTarget('Home', 2, 3), tabTarget('End', 0, 3)])
      .toEqual([0, 2, 0, 2])
    expect(tabTarget('a', 0, 3)).toBeNull()
  })

  it('con idPrefix cada pestaña controla su panel', () => {
    render(<>
      <Tabs items={items} value="a" onChange={() => {}} label="Perfil" idPrefix="perfil" />
      <div {...tabPanelProps('perfil', 'a')}>Resumen del jugador</div>
    </>)
    const tab = screen.getByRole('tab', { name: 'Resumen' })
    expect(tab).toHaveAttribute('aria-controls', 'perfil-panel-a')
    expect(screen.getByRole('tabpanel', { name: 'Resumen' })).toHaveTextContent('Resumen del jugador')
  })

  it('las teclas mueven la selección y el foco; solo la activa es tabulable', async () => {
    function Host() {
      const [v, setV] = useState('a')
      return <Tabs items={items} value={v} onChange={setV} label="Perfil" />
    }
    render(<Host />)
    const [first, , last] = screen.getAllByRole('tab')
    expect(first).toHaveAttribute('tabindex', '0')
    expect(last).toHaveAttribute('tabindex', '-1')
    first.focus()
    await userEvent.keyboard('{End}')
    expect(last).toHaveAttribute('aria-selected', 'true')
    expect(last).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(first).toHaveFocus()
  })
})

describe('Campos', () => {
  it('clampInt acota y trata el texto inválido como 0', () => {
    expect([clampInt('45', 1, 30), clampInt('x', 1, 30), clampInt(-3, 0, 9)]).toEqual([30, 1, 0])
  })

  it('NumberField suma, resta y respeta los límites', async () => {
    const onChange = vi.fn()
    render(<NumberField label="Generaciones" value={30} min={1} max={30} onChange={onChange} />)
    expect(screen.getByRole('group', { name: 'Generaciones' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Sumar 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Restar 1' }))
    expect(onChange.mock.calls).toEqual([[30], [29]])
  })

  it('TextField, SelectField y Switch avisan los cambios', async () => {
    const onText = vi.fn()
    const onSelect = vi.fn()
    const onSwitch = vi.fn()
    render(<>
      <TextField label="Nombre" value="" onChange={onText} invalid />
      <SelectField label="Mapa" value="Tharsis" onChange={onSelect} options={[{ value: 'Tharsis', label: 'Tharsis' }, { value: 'Hellas', label: 'Hellas' }]} />
      <Switch checked={false} onChange={onSwitch}>Sin draft</Switch>
    </>)
    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre' }), 'F')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Mapa' }), 'Hellas')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sin draft' }))
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveAttribute('aria-invalid', 'true')
    expect([onText.mock.calls[0][0], onSelect.mock.calls[0][0], onSwitch.mock.calls[0][0]]).toEqual(['F', 'Hellas', true])
  })
})
