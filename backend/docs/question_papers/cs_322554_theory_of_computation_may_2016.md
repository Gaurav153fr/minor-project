# Theory of Computation (Fifth Semester Examination)

**Code:** CS-322554  
**Exam:** B.E. (Fifth Semester) Examination, April-May 2016 (New Scheme)  
**Branch:** CSE Engg. Branch  
**Subject:** Theory of Computation  
**Time Allowed:** Three hours  
**Maximum Marks:** 80  
**Minimum Pass Marks:** 28  
**Note:** Subquestion (a) is compulsory from each unit. Solve any two out of subquestions (b), (c), (d) from each unit.

---

## Unit-I

### 1. (a) Write the Tuple Representation of Finite Automata (FA). [4 Marks]
- **Answer:**
  A Finite Automaton (FA) is formally defined as a 5-tuple:
  $$M = (Q, \Sigma, \delta, q_0, F)$$
  Where:
  1. $Q$: Finite set of internal states.
  2. $\Sigma$: Finite set of input symbols (alphabet).
  3. $\delta$: State transition function ($\delta: Q \times \Sigma \to Q$ for DFA, $\delta: Q \times (\Sigma \cup \{\varepsilon\}) \to 2^Q$ for NFA).
  4. $q_0 \in Q$: Initial / starting state.
  5. $F \subseteq Q$: Set of final / accepting states.

### 1. (b) Construct a DFA equivalent to an NFA with $\varepsilon$-transitions. [8 Marks]
- **Answer:**
  **Subset Construction Algorithm:**
  1. Compute $\varepsilon\text{-closure}(q_0)$ to find the starting state of the equivalent DFA.
  2. For each DFA state $S$ and input symbol $a \in \Sigma$, compute:
     $$S' = \varepsilon\text{-closure}\left(\bigcup_{q \in S} \delta(q, a)\right)$$
  3. Designate any DFA state containing at least one state from the original NFA final states set $F$ as an accepting state.
  4. Construct the equivalent DFA transition table and state diagram.

### 1. (c) Construct a Moore machine equivalent to a Mealy Machine. [8 Marks]
- **Answer:**
  **Conversion Procedure:**
  1. For each Mealy state $q$ that has multiple distinct output symbols associated with incoming transitions, split $q$ into multiple states $q_{o_1}, q_{o_2}, \dots, q_{o_k}$ where each sub-state is permanently associated with one output symbol.
  2. Replicate all outgoing transitions from original state $q$ for every newly created split state.
  3. Set the Moore output for each state as its assigned output symbol.

### 1. (d) Construct a FA for the set of strings $w$ over $\{a, b\}$ such that $w$ ends in the substring $ab$. [8 Marks]
- **Answer:**
  **Language Definition:** $L = \{w \cdot ab \mid w \in \{a, b\}^*\}$
  - States: $q_0$ (Start, no prefix), $q_1$ (Read 'a'), $q_2$ (Read 'ab', Accepting state).
  - Transitions:
    - $\delta(q_0, a) = q_1$, $\delta(q_0, b) = q_0$
    - $\delta(q_1, a) = q_1$, $\delta(q_1, b) = q_2$
    - $\delta(q_2, a) = q_1$, $\delta(q_2, b) = q_0$

---

## Unit-II

### 2. (a) Describe the following set by regular expression $\{0, 00, 000, \dots\}$. [4 Marks]
- **Answer:**
  The given set represents all strings of one or more consecutive zeroes.
  - **Regular Expression:** `0^+` or `0(0)*` or `00*`.

### 2. (b) Convert the regular expression $1 + (0+11)0^*1$ into its equivalent NFA. [8 Marks]
- **Answer:**
  Using Thompson's Construction:
  1. Construct base automaton for sub-expression $(0+11)$ using union and concatenation.
  2. Create loop transition for $0^*$.
  3. Concatenate $(0+11)$, $0^*$, and $1$.
  4. Perform union with $1$ using $\varepsilon$-transitions from a new initial state to create the final NFA.

### 2. (c) Describe Pumping Lemma for regular sets. [8 Marks]
- **Answer:**
  **Statement:** If $L$ is a regular language, there exists a constant $p$ (pumping length) such that any string $s \in L$ with $|s| \ge p$ can be partitioned into three substrings $s = xyz$ satisfying:
  1. $|xy| \le p$
  2. $|y| > 0$ ($y \neq \varepsilon$)
  3. $\forall i \ge 0,\ xy^i z \in L$
  **Application:** Used as a proof by contradiction to establish that a given language is NOT regular.

### 2. (d) Construct a regular grammar equivalent to a given DFA. [8 Marks]
- **Answer:**
  For each state transition $\delta(A, a) = B$ in the DFA:
  - Add production rule: $A \to aB$.
  - If state $B$ is an accepting state ($B \in F$), also add production rule: $A \to a$.
  - If initial state $q_0 \in F$, add: $S \to \varepsilon$.

---

## Unit-III

### 3. (a) How does a DPDA differ from NPDA? [4 Marks]
- **Answer:**
  | Feature | Deterministic Pushdown Automaton (DPDA) | Non-Deterministic Pushdown Automaton (NPDA) |
  | :--- | :--- | :--- |
  | **Transitions** | Exactly one deterministic move per state & stack symbol | Multiple possible transitions on the same state and input |
  | **Language Class** | Recognizes Deterministic CFLs (DCFLs) | Recognizes all Context-Free Languages (CFLs) |
  | **Equivalence** | DPDA is strictly less powerful than NPDA | NPDA is strictly more expressive than DPDA |
  | **Parsing** | Basis of LR(k) / deterministic compilers | Requires backtracking / non-deterministic branches |

### 3. (b) Design a Turing Machine (TM) to accept the language $L = \{0^n 1^n \mid n \ge 1\}$. [8 Marks]
- **Answer:**
  **Algorithm:**
  1. Scan left-to-right to find the first unmarked `0`, mark it as `X`, and move right.
  2. Scan through remaining `0`s and `Y`s to find the first corresponding unmarked `1`, mark it as `Y`.
  3. Move tape head left back to the first `X`, then step right to the next `0`.
  4. Repeat steps 1–3 until all `0`s and `1`s are matched.
  5. If no unmatched `0` or `1` remains, enter accepting state $q_{accept}$.

### 3. (c) Explain Post Correspondence Problem (PCP). [8 Marks]
- **Answer:**
  **Definition:** Given two lists of non-empty strings over alphabet $\Sigma$:
  $$A = (w_1, w_2, \dots, w_k) \quad \text{and} \quad B = (x_1, x_2, \dots, x_k)$$
  The Post Correspondence Problem asks whether there exists a sequence of indices $(i_1, i_2, \dots, i_m)$ such that:
  $$w_{i_1} w_{i_2} \dots w_{i_m} = x_{i_1} x_{i_2} \dots x_{i_m}$$
  **Significance:** PCP is proven to be **undecidable** (no general algorithm exists to solve it), and is frequently used in reduction proofs.
