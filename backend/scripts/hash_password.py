"""Genera AUTH_PASSWORD_HASH para el backend (D-49).

    python -m scripts.hash_password            # pide la contraseña dos veces, sin eco

Imprime solo el hash; la contraseña nunca se guarda ni se muestra.
"""
import getpass
import sys

from services.auth_service import hash_password

__all__ = ["hash_password"]


def main() -> int:
    password = getpass.getpass("Contraseña: ")
    if not password:
        print("La contraseña no puede estar vacía.", file=sys.stderr)
        return 1
    if getpass.getpass("Repetila: ") != password:
        print("Las contraseñas no coinciden.", file=sys.stderr)
        return 1
    print(hash_password(password))
    return 0


if __name__ == "__main__":
    sys.exit(main())
