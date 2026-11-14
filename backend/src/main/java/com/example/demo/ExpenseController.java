package com.example.demo;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ExpenseController {

    private final List<Expense> expenses = new ArrayList<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public ExpenseController() {
        // Pre-populate 3 sample entries on startup (1 initial budget entry and 2 expenses)
        expenses.add(new Expense(idGenerator.getAndIncrement(), "Monthly Budget", 5000.0, "Bills", "BUDGET"));
        expenses.add(new Expense(idGenerator.getAndIncrement(), "Grocery Shopping", 150.0, "Food", "EXPENSE"));
        expenses.add(new Expense(idGenerator.getAndIncrement(), "Train Ticket", 45.0, "Travel", "EXPENSE"));
    }

    @GetMapping
    public List<Expense> getAllExpenses() {
        return expenses;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Expense> getExpenseById(@PathVariable Long id) {
        return expenses.stream()
                .filter(expense -> expense.getId() != null && expense.getId().equals(id))
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Expense addExpense(@RequestBody Expense expense) {
        expense.setId(idGenerator.getAndIncrement());
        expenses.add(expense);
        return expense;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        boolean removed = expenses.removeIf(expense -> expense.getId() != null && expense.getId().equals(id));
        if (removed) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
