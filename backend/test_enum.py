from enum import Enum


class A(str, Enum):
    V = 'admin'

print(f"Seu papel atual é: {A.V}")
