from setuptools import setup, find_packages
from os import environ

__VERSION__ = environ.get("VBUILD") or "2024.0.0"


setup(
    name='millegrilles_coupdoeil',
    version=__VERSION__,
    packages=find_packages(),
    url='https://github.com/dugrema/millegrilles.coupdoeil',
    license='AFFERO',
    author='Mathieu Dugre',
    author_email='mathieu.dugre@mdugre.info',
    description="Client web et serveur pour Coud D'Oeil",
    install_requires=[]
)
