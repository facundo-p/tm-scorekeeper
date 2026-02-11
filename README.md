# tm-scorekeeper
A web application to record Terraforming Mars game results, track player statistics, rankings, and historical records.

## 📋 Tabla de Contenidos
- [Requisitos Previos](#requisitos-previos)
- [Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
- [Ejecución de la Aplicación](#ejecución-de-la-aplicación)
- [Estructura del Proyecto](#estructura-del-proyecto)

---

## 🔧 Requisitos Previos

Antes de comenzar, necesitas tener instalado:

1. **Python 3.12 o superior**
   - Descarga desde: https://www.python.org/downloads/
   - Verifica la instalación abriendo PowerShell y ejecutando:
     ```powershell
     python --version
     ```
   - Deberías ver algo como: `Python 3.12.x`

2. **Git** (opcional pero recomendado)
   - Para clonar el repositorio

---

## 🚀 Configuración del Entorno de Desarrollo

### Paso 1: Clonar o navegar al proyecto

Si ya tienes el proyecto descargado, abre PowerShell en la carpeta raíz del proyecto:

```powershell
cd "c:\Desarrollo\Personales\Terraforming Mars\tm-scorekeeper"
```

### Paso 2: Crear un Virtual Environment (venv)

Un **virtual environment** es una carpeta aislada donde Python instala las dependencias del proyecto sin afectar el Python global de tu sistema.

**¿Por qué es importante?**
- Cada proyecto puede tener diferentes versiones de librerías
- Evita conflictos entre proyectos
- Mantiene tu sistema limpio

**Ejecuta este comando:**

```powershell
python -m venv .venv
```

**Explicación del comando:**
- `python` - Ejecuta el intérprete de Python
- `-m venv` - Le dice a Python que ejecute el módulo `venv` (virtual environment)
- `.venv` - Es el nombre de la carpeta donde se creará el entorno aislado (el punto inicial hace que sea oculta por defecto)

**Resultado esperado:**
Se creará una carpeta `.venv` en el directorio del proyecto con una estructura similar a:
```
.venv/
├── Scripts/          (en Windows)
├── Lib/
└── pyvenv.cfg
```

### Paso 3: Activar el Virtual Environment

Para "entrar" al virtual environment y que Python use las librerías del proyecto, ejecuta:

```powershell
.\.venv\Scripts\Activate.ps1
```

**Explicación del comando:**
- `.\` - Significa "en el directorio actual"
- `.venv\Scripts\Activate.ps1` - Es el script que activa el entorno virtual
- `.ps1` - Extensión para PowerShell

**¿Cómo sé que se activó correctamente?**

Después de ejecutar el comando, deberías ver en tu terminal algo así:

```
(.venv) C:\Desarrollo\Personales\Terraforming Mars\tm-scorekeeper>
```

Nota el `(.venv)` al inicio - eso indica que el virtual environment está activo. ✅

**Si ves un error de permisos:**
Si recibes un error sobre "execution policies", ejecuta esto una vez:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Paso 4: Instalar las Dependencias

Ahora que estás dentro del virtual environment, instala todas las librerías necesarias:

```powershell
pip install -r requirements.txt
```

**Explicación del comando:**
- `pip` - Es el gestor de paquetes de Python (Package Installer for Python)
- `install` - Comando para instalar paquetes
- `-r requirements.txt` - Lee el archivo `requirements.txt` que contiene la lista de dependencias necesarias

**¿Qué se instala?**

El archivo `requirements.txt` contiene:
- `fastapi` - Framework web para crear APIs
- `uvicorn` - Servidor ASGI que ejecuta FastAPI
- `pydantic` - Validación de datos
- `pytest` - Framework para hacer tests/pruebas
- `httpx` - Cliente HTTP para testing

**Resultado esperado:**
Verás muchas líneas de instalación y al final algo como:
```
Successfully installed fastapi-0.104.1 uvicorn-0.24.0 pydantic-2.5.0 ...
```

---

## ▶️ Ejecución de la Aplicación

### Opción 1: Usando el Script (Recomendado)

```powershell
.\run.ps1
```

Este script automáticamente:
1. Navega a la carpeta `backend`
2. Inicia el servidor uvicorn con `--reload` (reinicia automáticamente cuando cambias código)

**Resultado esperado:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### Opción 2: Comando Manual

Si prefieres hacerlo paso a paso:

```powershell
cd backend
uvicorn main:app --reload
```

**Explicación del comando:**
- `uvicorn` - Ejecuta el servidor web
- `main:app` - Busca en el archivo `main.py` la variable `app` (que es nuestra aplicación FastAPI)
- `--reload` - Reinicia automáticamente el servidor cuando cambias el código (muy útil en desarrollo)

### Acceder a la Aplicación

Una vez que el servidor esté corriendo, abre tu navegador en:

- **API Documentation (Swagger)**: http://localhost:8000/docs
- **Alternative Documentation (ReDoc)**: http://localhost:8000/redoc
- **API Base URL**: http://localhost:8000

### Detener el Servidor

Presiona `Ctrl + C` en la terminal.

---

## 📁 Estructura del Proyecto

```
tm-scorekeeper/
├── backend/                    # Código del servidor (FastAPI)
│   ├── main.py                 # Punto de entrada de la aplicación
│   ├── models/                 # Definiciones de datos (DTOs)
│   ├── routes/                 # Endpoints de la API
│   ├── services/               # Lógica de negocio
│   ├── repositories/           # Acceso a datos
│   ├── schemas/                # Esquemas de respuesta
│   └── tests/                  # Tests unitarios
├── frontend/                   # Código del cliente (si aplica)
├── docs/                       # Documentación adicional
├── requirements.txt            # Dependencias del proyecto
├── run.ps1                      # Script para ejecutar en Windows
├── run.sh                       # Script para ejecutar en Linux/Mac
└── README.md                   # Este archivo
```

---

## 💡 Consejos Importantes

### Deactivar el Virtual Environment

Si en algún momento quieres salir del virtual environment, ejecuta:
```powershell
deactivate
```

Verás que desaparece el `(.venv)` del inicio de tu terminal.

### Cada vez que abres una nueva terminal

Recuerda que necesitas reactivar el virtual environment:
```powershell
.\.venv\Scripts\Activate.ps1
```

### Agregar nuevas dependencias

Si necesitas instalar una nueva librería:
```powershell
pip install nombre_del_paquete
pip freeze > requirements.txt  # Actualiza el archivo de dependencias
```

### Ver las dependencias instaladas

```powershell
pip list
```

---

## 🐛 Solución de Problemas

### "comando no reconocido: python"
- Python no está instalado o no está en el PATH
- Reinstala Python desde https://www.python.org/downloads/
- **Importante**: Marca la opción "Add Python to PATH" durante la instalación

### "Error de permisos al ejecutar Activate.ps1"
- Ejecuta: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Luego intenta activar el venv de nuevo

### "ModuleNotFoundError: No module named 'fastapi'"
- Asegúrate de que el virtual environment está activo (ves `(.venv)` en la terminal)
- Ejecuta `pip install -r requirements.txt` nuevamente

---

## 📞 ¿Necesitas más ayuda?

Si tienes dudas sobre algún comando o concepto, consulta la documentación oficial:
- [Python venv documentation](https://docs.python.org/3/library/venv.html)
- [FastAPI documentation](https://fastapi.tiangolo.com/)
- [Pip documentation](https://pip.pypa.io/)
