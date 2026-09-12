# Fourier Series

## Introduction
A Fourier series is an expansion of a periodic function f(x) in terms of an infinite sum of sines and cosines. Fourier series make use of the orthogonal relationships of the sine and cosine functions.

## Euler's Formulae
The Fourier series for a function f(x) defined in the interval (c, c+2L) is given by:
f(x) = a_0 / 2 + sum_{n=1}^{infinity} (a_n cos(n pi x / L) + b_n sin(n pi x / L))

Where the coefficients are given by Euler's formulae:
a_0 = (1/L) int_{c}^{c+2L} f(x) dx
a_n = (1/L) int_{c}^{c+2L} f(x) cos(n pi x / L) dx
b_n = (1/L) int_{c}^{c+2L} f(x) sin(n pi x / L) dx

## Even and Odd Functions
If f(x) is an even function, its Fourier series only contains cosine terms (b_n = 0).
If f(x) is an odd function, its Fourier series only contains sine terms (a_0 = 0, a_n = 0).
