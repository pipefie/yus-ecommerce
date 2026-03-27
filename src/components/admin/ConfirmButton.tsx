'use client'

interface Props {
  message: string
  formAction: (formData: FormData) => Promise<void>
  name?: string
  value?: string
  className?: string
  children: React.ReactNode
}

export function ConfirmButton({ message, formAction, name, value, className, children }: Props) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(message)) {
      e.preventDefault()
    }
  }

  return (
    <button
      type="submit"
      formAction={formAction as unknown as string}
      name={name}
      value={value}
      onClick={handleClick}
      className={className}
    >
      {children}
    </button>
  )
}
