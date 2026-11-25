-- Migration 0002: endurecimento de integridade no D1 (impedir mutações pós-sorteio e associações entre eventos distintos)

CREATE TRIGGER IF NOT EXISTS trg_participants_no_insert_after_draw
BEFORE INSERT ON participants
WHEN EXISTS (
  SELECT 1 FROM events WHERE id = NEW.event_id AND status = 'completed'
)
BEGIN
  SELECT RAISE(ABORT, 'Cannot add participant to completed event');
END;

CREATE TRIGGER IF NOT EXISTS trg_participants_no_delete_after_draw
BEFORE DELETE ON participants
WHEN EXISTS (
  SELECT 1 FROM events WHERE id = OLD.event_id AND status = 'completed'
)
BEGIN
  SELECT RAISE(ABORT, 'Cannot delete participant from completed event');
END;

CREATE TRIGGER IF NOT EXISTS trg_draws_same_event_participants
BEFORE INSERT ON draws
WHEN NOT EXISTS (
  SELECT 1 FROM participants WHERE id = NEW.giver_id AND event_id = NEW.event_id
) OR NOT EXISTS (
  SELECT 1 FROM participants WHERE id = NEW.receiver_id AND event_id = NEW.event_id
)
BEGIN
  SELECT RAISE(ABORT, 'Participants must belong to the draw event');
END;
