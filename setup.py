from setuptools import setup, find_packages

setup(
    name="thesaurus-backend",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "pydantic",
        "python-dotenv",
        "pytest",
        "httpx",
        "pandas",
        "pyyaml",
    ],
    extras_require={
        'test': [
            'pytest>=7.0.0',
            'pytest-asyncio>=0.20.0',
            'pytest-cov>=4.0.0',
            'aiohttp>=3.8.0',
            'requests>=2.28.0',
            'httpx>=0.24.0',
        ]
    },
    python_requires=">=3.8",
) 