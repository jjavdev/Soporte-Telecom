import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

describe('Componentes UI base', () => {
  it('Button: renderiza el texto y maneja clicks', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Crear ticket</Button>)

    const button = screen.getByRole('button', { name: 'Crear ticket' })
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('Button: no dispara onClick cuando está deshabilitado', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Guardar</Button>)

    const button = screen.getByRole('button', { name: 'Guardar' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('Badge: renderiza etiquetas de estado', () => {
    render(<Badge variant="secondary">Abierto</Badge>)
    expect(screen.getByText('Abierto')).toBeInTheDocument()
  })

  it('Badge: muestra etiquetas de prioridad', () => {
    render(<Badge variant="destructive">Urgente</Badge>)
    expect(screen.getByText('Urgente')).toBeInTheDocument()
  })
})
