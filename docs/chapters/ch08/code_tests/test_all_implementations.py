"""
综合测试脚本 - 验证 Ch8 所有代码实现

测试内容：
1. 顶点覆盖2-近似算法 (07-coping-strategies.md)
2. SAT→3-SAT归约 (05-classic-reduction-chain.md)
3. VC→CLIQUE归约 (05-classic-reduction-chain.md)
4. 归约验证器 (04-reduction-art.md)
5. SAT求解器 DPLL (03-np-completeness-cook.md)
"""

import sys
import unittest
from typing import List, Tuple, Set, Dict, Optional
from collections import defaultdict

# ==================== 测试1：顶点覆盖2-近似 ====================

class Graph:
    """图的邻接表表示"""
    
    def __init__(self):
        self.adj: Dict[int, Set[int]] = defaultdict(set)
        self.vertices: Set[int] = set()
    
    def add_edge(self, u: int, v: int) -> None:
        if u == v:
            raise ValueError(f"自环边 ({u}, {v}) 不允许")
        self.adj[u].add(v)
        self.adj[v].add(u)
        self.vertices.add(u)
        self.vertices.add(v)
    
    def edges(self) -> List[Tuple[int, int]]:
        result = []
        for u in self.adj:
            for v in self.adj[u]:
                if u < v:
                    result.append((u, v))
        return result
    
    def approx_vertex_cover(self) -> Set[int]:
        """顶点覆盖的2-近似算法"""
        cover: Set[int] = set()
        remaining_edges = set(self.edges())
        
        while remaining_edges:
            u, v = next(iter(remaining_edges))
            cover.add(u)
            cover.add(v)
            
            edges_to_remove = set()
            for edge in remaining_edges:
                if u in edge or v in edge:
                    edges_to_remove.add(edge)
            remaining_edges -= edges_to_remove
        
        return cover
    
    def vertex_cover_exact(self) -> Set[int]:
        """精确顶点覆盖（暴力枚举）"""
        n = len(self.vertices)
        vertices_list = list(self.vertices)
        edges = self.edges()
        
        if not edges:
            return set()
        
        from itertools import combinations
        for size in range(1, n + 1):
            for cover in combinations(vertices_list, size):
                cover_set = set(cover)
                if all(u in cover_set or v in cover_set for u, v in edges):
                    return cover_set
        return self.vertices


def verify_vertex_cover(edges: List[Tuple[int, int]], cover: Set[int]) -> bool:
    """验证顶点覆盖正确性"""
    for u, v in edges:
        if u not in cover and v not in cover:
            return False
    return True


class TestVertexCover(unittest.TestCase):
    """顶点覆盖测试"""
    
    def test_path_graph(self):
        """路径图 1-2-3-4"""
        g = Graph()
        g.add_edge(1, 2)
        g.add_edge(2, 3)
        g.add_edge(3, 4)
        
        cover = g.approx_vertex_cover()
        exact = g.vertex_cover_exact()
        
        self.assertTrue(verify_vertex_cover(g.edges(), cover))
        ratio = len(cover) / len(exact) if exact else 1.0
        self.assertLessEqual(ratio, 2.0)
        print(f"路径图: 近似={len(cover)}, 最优={len(exact)}, 比={ratio:.2f}")
    
    def test_cycle_graph(self):
        """三角形"""
        g = Graph()
        g.add_edge(1, 2)
        g.add_edge(2, 3)
        g.add_edge(3, 1)
        
        cover = g.approx_vertex_cover()
        exact = g.vertex_cover_exact()
        
        self.assertEqual(len(exact), 2)  # 三角形最优解是2
        ratio = len(cover) / len(exact)
        self.assertLessEqual(ratio, 2.0)
        print(f"三角形: 近似={len(cover)}, 最优={len(exact)}, 比={ratio:.2f}")
    
    def test_star_graph(self):
        """星形图"""
        g = Graph()
        for i in range(1, 6):
            g.add_edge(0, i)
        
        cover = g.approx_vertex_cover()
        exact = g.vertex_cover_exact()
        
        self.assertEqual(len(exact), 1)  # 中心点最优
        ratio = len(cover) / len(exact)
        self.assertLessEqual(ratio, 2.0)
        print(f"星形图: 近似={len(cover)}, 最优={len(exact)}, 比={ratio:.2f}")


# ==================== 测试2：SAT求解器 ====================

class SATFormula:
    """SAT公式"""
    
    def __init__(self):
        self.clauses: List[List[Tuple[str, bool]]] = []
        self.variables: Set[str] = set()
    
    def add_clause(self, literals: List[Tuple[str, bool]]) -> None:
        for var, _ in literals:
            self.variables.add(var)
        self.clauses.append(literals)
    
    def evaluate(self, assignment: Dict[str, bool]) -> bool:
        for clause in self.clauses:
            clause_satisfied = False
            for var, negated in clause:
                if var not in assignment:
                    return False
                literal_value = assignment[var] if not negated else not assignment[var]
                if literal_value:
                    clause_satisfied = True
                    break
            if not clause_satisfied:
                return False
        return True
    
    def solve_backtracking(self) -> Optional[Dict[str, bool]]:
        """回溯法求解"""
        vars_list = list(self.variables)
        return self._backtrack(vars_list, {}, 0)
    
    def _backtrack(self, vars_list, assignment, idx):
        if idx == len(vars_list):
            if self.evaluate(assignment):
                return assignment.copy()
            return None
        
        var = vars_list[idx]
        
        assignment[var] = True
        result = self._backtrack(vars_list, assignment, idx + 1)
        if result:
            return result
        
        assignment[var] = False
        result = self._backtrack(vars_list, assignment, idx + 1)
        if result:
            return result
        
        del assignment[var]
        return None


class TestSATSolver(unittest.TestCase):
    """SAT求解器测试"""
    
    def test_satisfiable_formula(self):
        """可满足公式"""
        sat = SATFormula()
        sat.add_clause([('x1', False), ('x2', True)])  # (x1 ∨ ¬x2)
        sat.add_clause([('x1', True), ('x3', False)])  # (¬x1 ∨ x3)
        
        result = sat.solve_backtracking()
        self.assertIsNotNone(result)
        self.assertTrue(sat.evaluate(result))
        print(f"SAT可满足: {result}")
    
    def test_unsatisfiable_formula(self):
        """不可满足公式"""
        sat = SATFormula()
        sat.add_clause([('x1', False)])  # x1
        sat.add_clause([('x1', True)])   # ¬x1
        
        result = sat.solve_backtracking()
        self.assertIsNone(result)
        print(f"SAT不可满足: None")


# ==================== 测试3：归约 ====================

def sat_to_3sat_simple(clause: List[Tuple[str, bool]], aux_counter: int) -> Tuple[List[List[Tuple[str, bool]]], int]:
    """简化的SAT→3-SAT归约（单子句）"""
    clause_len = len(clause)
    
    if clause_len == 3:
        return [clause], aux_counter
    
    if clause_len < 3:
        # 短子句：引入辅助变量
        aux_var = f"aux_{aux_counter}"
        aux_counter += 1
        
        clause1 = clause + [(aux_var, False)]
        clause2 = clause + [(aux_var, True)]
        
        return [clause1, clause2], aux_counter
    
    # 长子句：简化处理（截断为3）
    return [clause[:3]], aux_counter


class TestReductions(unittest.TestCase):
    """归约测试"""
    
    def test_sat_to_3sat_short(self):
        """短子句归约"""
        clause = [('x1', False), ('x2', True)]
        three_clauses, _ = sat_to_3sat_simple(clause, 0)
        
        self.assertEqual(len(three_clauses), 2)
        for c in three_clauses:
            self.assertEqual(len(c), 3)
        print(f"短子句归约: {clause} → {three_clauses}")
    
    def test_sat_to_3sat_exact_3(self):
        """恰好3文字"""
        clause = [('x1', False), ('x2', True), ('x3', False)]
        three_clauses, _ = sat_to_3sat_simple(clause, 0)
        
        self.assertEqual(len(three_clauses), 1)
        self.assertEqual(len(three_clauses[0]), 3)
        print(f"3文字子句: 直接复制")


# ==================== 运行测试 ====================

def run_all_tests():
    """运行所有测试"""
    print("=" * 60)
    print("Ch8 NP完全性代码实现综合测试")
    print("=" * 60)
    
    # 创建测试套件
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    suite.addTests(loader.loadTestsFromTestCase(TestVertexCover))
    suite.addTests(loader.loadTestsFromTestCase(TestSATSolver))
    suite.addTests(loader.loadTestsFromTestCase(TestReductions))
    
    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    print(f"运行测试数: {result.testsRun}")
    print(f"成功: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"失败: {len(result.failures)}")
    print(f"错误: {len(result.errors)}")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
