from fastapi import APIRouter, HTTPException

from app.schemas.common import (
    GroceryFromMealRequest,
    GroceryItemCreate,
    GroceryItemUpdate,
    GroceryList,
    GroceryListItem,
    GroceryListCreate,
)
from app.services.store import generate_id, grocery_lists

router = APIRouter(prefix="/grocery-lists", tags=["grocery"])


@router.get("/", response_model=list[GroceryList])
def list_grocery_lists() -> list[GroceryList]:
    return grocery_lists


@router.post("/", response_model=GroceryList)
def create_grocery_list(payload: GroceryListCreate) -> GroceryList:
    grocery_list = GroceryList(id=generate_id(), title=payload.title)
    grocery_lists.append(grocery_list)
    return grocery_list


@router.post("/{list_id}/items", response_model=GroceryList)
def add_item(list_id: str, payload: GroceryItemCreate) -> GroceryList:
    grocery_list = _find_list(list_id)
    grocery_list.items.append(
        GroceryListItem(
            id=generate_id(),
            **payload.model_dump(),
        )
    )
    return grocery_list


@router.patch("/{list_id}/items/{item_id}", response_model=GroceryList)
def update_item(list_id: str, item_id: str, payload: GroceryItemUpdate) -> GroceryList:
    grocery_list = _find_list(list_id)
    item = next((entry for entry in grocery_list.items if entry.id == item_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in payload.model_dump(exclude_none=True).items():
        setattr(item, key, value)
    return grocery_list


@router.delete("/{list_id}/items/{item_id}", response_model=GroceryList)
def delete_item(list_id: str, item_id: str) -> GroceryList:
    grocery_list = _find_list(list_id)
    grocery_list.items = [entry for entry in grocery_list.items if entry.id != item_id]
    return grocery_list


@router.post("/from-meal", response_model=GroceryList)
def from_meal(payload: GroceryFromMealRequest) -> GroceryList:
    grocery_list = GroceryList(id=generate_id(), title=payload.title)
    category_lookup = {
        "granola": "pantry",
        "salsa": "pantry",
        "avocado": "produce",
        "whole wheat tortillas": "pantry",
    }
    for item_name in payload.items:
        grocery_list.items.append(
            GroceryListItem(
                id=generate_id(),
                item_name=item_name,
                category=category_lookup.get(item_name, "produce"),
                quantity="1",
            )
        )
    grocery_lists.append(grocery_list)
    return grocery_list


def _find_list(list_id: str) -> GroceryList:
    grocery_list = next((entry for entry in grocery_lists if entry.id == list_id), None)
    if grocery_list is None:
        raise HTTPException(status_code=404, detail="List not found")
    return grocery_list
