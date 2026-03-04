import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePlayers } from '@/hooks/usePlayers'
import Button from '@/components/Button/Button'
import Spinner from '@/components/Spinner/Spinner'
import Modal from '@/components/Modal/Modal'
import Input from '@/components/Input/Input'
import type { PlayerResponseDTO } from '@/types'
import styles from './Players.module.css'

interface PlayerFormProps {
  player?: PlayerResponseDTO
  onSave: (name: string) => Promise<void>
  onToggleActive?: () => Promise<void>
  onCancel: () => void
}

function PlayerForm({ player, onSave, onToggleActive, onCancel }: PlayerFormProps) {
  const [name, setName] = useState(player?.name ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) { setError('El nombre es requerido.'); return }
    setSaving(true)
    try {
      await onSave(name.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    if (!onToggleActive) return
    setSaving(true)
    try {
      await onToggleActive()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.formGroup}>
      {error && <p className={styles.formError}>{error}</p>}
      <Input
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
      />
      <div className={styles.formActions}>
        {onToggleActive && (
          <Button variant="danger" onClick={handleToggleActive} disabled={saving}>
            {player?.is_active ? 'Desactivar' : 'Activar'}
          </Button>
        )}
        <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  )
}

export default function Players() {
  const navigate = useNavigate()
  const [activeOnly, setActiveOnly] = useState(true)
  const { players, loading, error, addPlayer, editPlayer } = usePlayers({ activeOnly })
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<PlayerResponseDTO | null>(null)

  const handleCreate = async (name: string) => {
    await addPlayer({ name })
    setShowCreate(false)
  }

  const handleEdit = async (name: string) => {
    if (!editing) return
    await editPlayer(editing.player_id, { name })
    setEditing(null)
  }

  const handleToggleActive = async () => {
    if (!editing) return
    await editPlayer(editing.player_id, { is_active: !editing.is_active })
    setEditing(null)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/home"><Button variant="ghost" size="sm">← Inicio</Button></Link>
          <h1 className={styles.headerTitle}>Jugadores</h1>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>+ Nuevo</Button>
      </header>

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <span>{players.length} jugadores</span>
          <label className={styles.filter}>
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            Solo activos
          </label>
        </div>

        {error && <p className={styles.errorBox}>{error}</p>}
        {loading && <Spinner />}

        {!loading && players.length === 0 && (
          <p className={styles.empty}>No hay jugadores. ¡Crea el primero!</p>
        )}

        <div className={styles.list}>
          {players.map((player) => (
            <div
              key={player.player_id}
              className={styles.playerCard}
              onClick={() => navigate(`/players/${player.player_id}/profile`)}
            >
              <div className={styles.playerInfo}>
                <span className={styles.playerName}>{player.name}</span>
              </div>
              <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => setEditing(player)}>
                  Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showCreate && (
        <Modal title="Nuevo jugador" onClose={() => setShowCreate(false)}>
          <PlayerForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Editar jugador" onClose={() => setEditing(null)}>
          <PlayerForm
            player={editing}
            onSave={handleEdit}
            onToggleActive={handleToggleActive}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  )
}
