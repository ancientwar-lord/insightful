from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, col
from datetime import datetime
from zoneinfo import ZoneInfo
from ..db import get_session
from ..model import Note
from ..schemas import NoteCreateRequest, NoteUpdateRequest, NoteResponse, NoteListResponse

router = APIRouter(
    prefix="/notes",
    tags=["Notes"],
)

@router.post("/", response_model=NoteResponse)
def create_note(body: NoteCreateRequest, session: Session = Depends(get_session)):
    note = Note(
        title=body.title,
        content=body.content,
    )
    session.add(note)
    session.commit()
    session.refresh(note)
    return note

@router.get("/", response_model=NoteListResponse)
def get_notes(session: Session = Depends(get_session)):
    notes = session.exec(select(Note).order_by(col(Note.updated_at).desc())).all()
    return NoteListResponse(
        total=len(notes),
        notes=notes
    )

@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: int, session: Session = Depends(get_session)):
    note = session.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.patch("/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, body: NoteUpdateRequest, session: Session = Depends(get_session)):
    note = session.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if body.title is not None:
        note.title = body.title
    if body.content is not None:
        note.content = body.content
    note.updated_at = datetime.now(ZoneInfo("Asia/Kolkata"))
    
    session.add(note)
    session.commit()
    session.refresh(note)
    return note

@router.delete("/{note_id}")
def delete_note(note_id: int, session: Session = Depends(get_session)):
    note = session.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    session.delete(note)
    session.commit()
    return {"message": "Note deleted successfully"}
